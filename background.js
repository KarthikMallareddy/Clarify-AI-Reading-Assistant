/**
 * Background Service Worker
 * Handles API calls, manages state, coordinates between content scripts and popup
 */

// API Configuration
const CONFIG = {
  languageTool: {
    url: 'https://api.languagetool.org/v2/check',
    enabled: true
  },
  openai: {
    // User will add their API key in settings
    apiKey: '',
    model: 'gpt-4o-mini'
  }
};

// Load settings from storage
chrome.storage.sync.get(['openaiKey', 'languageToolEnabled'], (result) => {
  if (result.openaiKey) {
    CONFIG.openai.apiKey = result.openaiKey;
  }
  if (result.languageToolEnabled !== undefined) {
    CONFIG.languageTool.enabled = result.languageToolEnabled;
  }
});

/**
 * Grammar Check Handler
 * Calls LanguageTool API to find grammar errors
 */
async function checkGrammar(text) {
  if (!CONFIG.languageTool.enabled) {
    return { errors: [], message: 'Grammar checking is disabled' };
  }

  try {
    const response = await fetch(CONFIG.languageTool.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `text=${encodeURIComponent(text)}&language=en-US`
    });

    const data = await response.json();
    
    return {
      errors: data.matches.map(match => ({
        message: match.message,
        offset: match.offset,
        length: match.length,
        replacements: match.replacements.slice(0, 3).map(r => r.value),
        rule: match.rule.id,
        type: match.rule.category.id
      }))
    };
  } catch (error) {
    console.error('Grammar check failed:', error);
    return { errors: [], error: error.message };
  }
}

/**
 * Summarize Text Handler
 * Uses GPT-4 to create article summaries
 */
async function summarizeText(text, mode = 'quick') {
  if (!CONFIG.openai.apiKey) {
    return { error: 'OpenAI API key not configured. Add it in settings.' };
  }

  const prompts = {
    quick: `Summarize this in 3 concise sentences:\n\n${text}`,
    detailed: `Provide a detailed summary with:\n1. Main argument (2-3 sentences)\n2. Key points (5 bullet points)\n3. Conclusion\n\n${text}`,
    eli5: `Explain this like I'm 5 years old:\n\n${text}`
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.openai.apiKey}`
      },
      body: JSON.stringify({
        model: CONFIG.openai.model,
        messages: [
          { role: 'user', content: prompts[mode] || prompts.quick }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return { error: data.error.message };
    }

    return {
      summary: data.choices[0].message.content,
      tokens: data.usage.total_tokens
    };
  } catch (error) {
    console.error('Summarization failed:', error);
    return { error: error.message };
  }
}

/**
 * Policy Analysis Handler
 * Analyzes privacy policies for red flags
 */
async function analyzePolicy(policyText) {
  if (!CONFIG.openai.apiKey) {
    return { error: 'OpenAI API key not configured' };
  }

  const prompt = `You are a privacy and legal analyst. Analyze this privacy policy and identify concerning clauses.

Return a JSON object with this exact structure:
{
  "riskLevel": "low" | "medium" | "high",
  "redFlags": [
    {
      "category": "data-selling" | "surveillance" | "rights" | "auto-renewal" | "liability",
      "severity": "low" | "medium" | "high",
      "clause": "exact quote from policy",
      "plainEnglish": "what this means in simple terms",
      "location": "section name or approximate location"
    }
  ],
  "importantClauses": ["list of important but not alarming clauses"],
  "summary": "2-3 sentence overall assessment"
}

Categories:
- data-selling: Sharing/selling user data to third parties
- surveillance: Tracking, monitoring, or extensive data collection
- rights: Limiting user rights (can't sue, forced arbitration, etc.)
- auto-renewal: Hidden auto-renewal or hard-to-cancel subscriptions
- liability: Company avoiding all responsibility

Policy to analyze:
${policyText.slice(0, 8000)}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.openai.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { 
            role: 'system', 
            content: 'You are a legal analyst specializing in privacy policies. Always return valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return { error: data.error.message };
    }

    const analysis = JSON.parse(data.choices[0].message.content);
    return analysis;
  } catch (error) {
    console.error('Policy analysis failed:', error);
    return { error: error.message };
  }
}

/**
 * Message Handler
 * Listens for requests from content scripts and popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkGrammar') {
    checkGrammar(request.text).then(sendResponse);
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'summarize') {
    summarizeText(request.text, request.mode).then(sendResponse);
    return true;
  }
  
  if (request.action === 'analyzePolicy') {
    analyzePolicy(request.text).then(sendResponse);
    return true;
  }
  
  if (request.action === 'updateConfig') {
    CONFIG.openai.apiKey = request.config.openaiKey || CONFIG.openai.apiKey;
    CONFIG.languageTool.enabled = request.config.languageToolEnabled ?? CONFIG.languageTool.enabled;
    sendResponse({ success: true });
  }
});

console.log('Clarify background service worker initialized');
