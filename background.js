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
  aiProvider: 'gemini', // 'openai' or 'gemini'
  openai: {
    apiKey: '',
    model: 'gpt-4o-mini'
  },
  gemini: {
    apiKey: '', // Get free key at https://aistudio.google.com/app/apikey
    model: 'gemini-1.5-flash' // Fast and free
  },
  premium: {
    isActive: false,
    licenseKey: null
  }
};

// Load settings from storage
chrome.storage.sync.get(['licenseKey', 'openaiKey', 'geminiKey', 'aiProvider', 'languageToolEnabled'], (result) => {
  if (chrome.runtime.lastError) {
    console.warn('Storage sync error (will retry with local):', chrome.runtime.lastError.message);
    // Fallback to local storage if sync fails
    chrome.storage.local.get(['licenseKey', 'openaiKey', 'geminiKey', 'aiProvider', 'languageToolEnabled'], (localResult) => {
      loadConfigFromResult(localResult || {});
    });
    return;
  }
  
  loadConfigFromResult(result || {});
});

/**
 * Load configuration from storage result
 */
function loadConfigFromResult(result) {
  if (result.licenseKey) {
    validateLicense(result.licenseKey);
  }
  if (result.openaiKey) {
    CONFIG.openai.apiKey = result.openaiKey;
  }
  if (result.geminiKey) {
    CONFIG.gemini.apiKey = result.geminiKey;
  }
  // Default to gemini if not set
  CONFIG.aiProvider = result.aiProvider || 'gemini';
  
  if (result.languageToolEnabled !== undefined) {
    CONFIG.languageTool.enabled = result.languageToolEnabled;
  }
  
  console.log('Loaded config:', {
    aiProvider: CONFIG.aiProvider,
    hasGeminiKey: !!CONFIG.gemini.apiKey,
    hasOpenAIKey: !!CONFIG.openai.apiKey,
    premium: CONFIG.premium.isActive
  });
}

/**
 * Validate License Key
 * Checks if user has premium access
 */
function validateLicense(licenseKey) {
  // Simple validation - you can make this more secure later
  // For now, we'll check against a pattern or validate with your server
  
  // Example: Premium keys start with "CLARIFY-PRO-"
  if (licenseKey && licenseKey.startsWith('CLARIFY-PRO-')) {
    CONFIG.premium.isActive = true;
    CONFIG.premium.licenseKey = licenseKey;
    console.log('Premium license activated');
    return true;
  }
  
  CONFIG.premium.isActive = false;
  console.log('Free tier - AI features disabled');
  return false;
}

/**
 * Grammar Check Handler
 * Hybrid approach: LanguageTool first, then AI fallback
 */
async function checkGrammar(text) {
  if (!CONFIG.languageTool.enabled) {
    return { errors: [], message: 'Grammar checking is disabled' };
  }

  try {
    // Step 1: Try LanguageTool first (free, fast)
    const ltErrors = await checkWithLanguageTool(text);
    
    // Step 2: If LanguageTool found errors, return them
    if (ltErrors.length > 0) {
      console.log('LanguageTool found', ltErrors.length, 'errors');
      return { errors: ltErrors, source: 'LanguageTool' };
    }
    
    // Step 3: AI fallback - PREMIUM ONLY
    // Only activate if user has premium license
    const hasApiKey = CONFIG.aiProvider === 'gemini' ? CONFIG.gemini.apiKey : CONFIG.openai.apiKey;
    
    if (CONFIG.premium.isActive && hasApiKey && text.length > 10) {
      console.log(`LanguageTool found 0 errors, trying AI fallback with ${CONFIG.aiProvider}...`);
      const aiErrors = await checkWithAI(text);
      if (aiErrors.length > 0) {
        console.log('AI found', aiErrors.length, 'additional errors');
        return { errors: aiErrors, source: 'AI' };
      }
    } else if (!CONFIG.premium.isActive && text.length > 10) {
      console.log('AI fallback available in Premium version');
    }
    
    // No errors found by either method
    return { errors: [], source: 'LanguageTool' };
    
  } catch (error) {
    console.error('Grammar check failed:', error);
    return { errors: [], error: error.message };
  }
}

/**
 * Check grammar using LanguageTool API
 */
async function checkWithLanguageTool(text) {
  const params = new URLSearchParams({
    text: text,
    language: 'en-US',
    enabledOnly: 'false',
    level: 'picky',
    enabledCategories: 'GRAMMAR,TYPOS,STYLE,REDUNDANCY,CONFUSED_WORDS'
  });

  const response = await fetch(CONFIG.languageTool.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: params.toString()
  });

  if (!response.ok) {
    throw new Error(`LanguageTool API error: ${response.status}`);
  }

  const data = await response.json();
  
  console.log(`LanguageTool found ${data.matches.length} errors in text: "${text.substring(0, 50)}..."`);
  
  return data.matches.map(match => ({
    message: match.message,
    shortMessage: match.shortMessage || match.message,
    offset: match.offset,
    length: match.length,
    replacements: match.replacements.slice(0, 3).map(r => r.value),
    rule: match.rule.id,
    ruleDescription: match.rule.description,
    type: match.rule.category.id,
    category: match.rule.category.name
  }));
}

/**
 * Check grammar using AI (OpenAI or Gemini)
 */
async function checkWithAI(text) {
  if (CONFIG.aiProvider === 'gemini') {
    return await checkWithGemini(text);
  } else {
    return await checkWithOpenAI(text);
  }
}

/**
 * Check grammar using OpenAI GPT
 */
async function checkWithOpenAI(text) {
  if (!CONFIG.openai.apiKey) {
    return [];
  }

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
          {
            role: 'system',
            content: 'You are a grammar checker. Analyze the text and return ONLY a JSON array of errors. Each error must have: offset (character position), length (error length), message (explanation), replacements (array of suggestions). If no errors, return empty array [].'
          },
          {
            role: 'user',
            content: `Check this text for grammar errors:\n\n"${text}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return [];
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    return parseAIResponse(content);
  } catch (error) {
    console.error('OpenAI error:', error);
    return [];
  }
}

/**
 * Check grammar using Google Gemini
 */
async function checkWithGemini(text) {
  if (!CONFIG.gemini.apiKey) {
    return [];
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.gemini.model}:generateContent?key=${CONFIG.gemini.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a grammar checker. Analyze the following text and return ONLY a JSON array of grammar errors. Each error must have: offset (character position from start), length (number of characters), message (explanation), replacements (array of correction suggestions). If no errors, return empty array [].\n\nText to check: "${text}"`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', response.status, errorData);
      return [];
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text.trim();
    
    return parseAIResponse(content);
  } catch (error) {
    console.error('Gemini error:', error);
    return [];
  }
}

/**
 * Parse AI response (works for both OpenAI and Gemini)
 */
function parseAIResponse(content) {
  let errors = [];
  try {
    // Remove markdown code blocks if present
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      errors = JSON.parse(jsonMatch[0]);
    } else {
      errors = JSON.parse(content);
    }
  } catch (e) {
    console.error('Failed to parse AI response:', e);
    return [];
  }
  
  // Validate and format errors
  return errors.filter(err => 
    err.offset !== undefined && 
    err.length !== undefined &&
    err.message &&
    err.replacements
  ).map(err => ({
    message: err.message,
    shortMessage: err.message,
    offset: err.offset,
    length: err.length,
    replacements: Array.isArray(err.replacements) ? err.replacements : [err.replacements],
    rule: 'AI_GRAMMAR',
    ruleDescription: 'AI-detected grammar issue',
    type: 'AI_GRAMMAR',
    category: 'Grammar (AI)'
  }));
}

/**
 * Summarize Text Handler
 * Uses AI (Gemini or OpenAI) to create article summaries
 */
async function summarizeText(text, mode = 'quick') {
  const hasApiKey = CONFIG.aiProvider === 'gemini' ? CONFIG.gemini.apiKey : CONFIG.openai.apiKey;
  
  if (!hasApiKey) {
    return { error: `${CONFIG.aiProvider === 'gemini' ? 'Gemini' : 'OpenAI'} API key not configured. Add it in settings.` };
  }

  const prompts = {
    quick: `Summarize this in 3 concise sentences:\n\n${text}`,
    detailed: `Provide a detailed summary with:\n1. Main argument (2-3 sentences)\n2. Key points (5 bullet points)\n3. Conclusion\n\n${text}`,
    eli5: `Explain this like I'm 5 years old:\n\n${text}`
  };

  const promptText = prompts[mode] || prompts.quick;

  try {
    if (CONFIG.aiProvider === 'gemini') {
      return await summarizeWithGemini(promptText);
    } else {
      return await summarizeWithOpenAI(promptText);
    }
  } catch (error) {
    console.error('Summarization failed:', error);
    return { error: error.message };
  }
}

/**
 * Summarize with OpenAI
 */
async function summarizeWithOpenAI(promptText) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CONFIG.openai.apiKey}`
    },
    body: JSON.stringify({
      model: CONFIG.openai.model,
      messages: [
        { role: 'user', content: promptText }
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
}

/**
 * Summarize with Gemini
 */
async function summarizeWithGemini(promptText) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.gemini.model}:generateContent?key=${CONFIG.gemini.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: promptText }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500
      }
    })
  });

  const data = await response.json();
  
  if (data.error) {
    return { error: data.error.message };
  }

  return {
    summary: data.candidates[0].content.parts[0].text,
    tokens: data.usageMetadata?.totalTokenCount || 0
  };
}

/**
 * Policy Analysis Handler
 * Analyzes privacy policies for red flags
 */
async function analyzePolicy(policyText) {
  const hasApiKey = CONFIG.aiProvider === 'gemini' ? CONFIG.gemini.apiKey : CONFIG.openai.apiKey;
  
  if (!hasApiKey) {
    return { error: `${CONFIG.aiProvider === 'gemini' ? 'Gemini' : 'OpenAI'} API key not configured` };
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
    if (CONFIG.aiProvider === 'gemini') {
      return await analyzePolicyWithGemini(prompt);
    } else {
      return await analyzePolicyWithOpenAI(prompt);
    }
  } catch (error) {
    console.error('Policy analysis failed:', error);
    return { error: error.message };
  }
}

/**
 * Analyze policy with OpenAI
 */
async function analyzePolicyWithOpenAI(prompt) {
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
}

/**
 * Analyze policy with Gemini
 */
async function analyzePolicyWithGemini(prompt) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.gemini.model}:generateContent?key=${CONFIG.gemini.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `You are a legal analyst specializing in privacy policies. Always return valid JSON.\n\n${prompt}`
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1500
      }
    })
  });

  const data = await response.json();
  
  if (data.error) {
    return { error: data.error.message };
  }

  const content = data.candidates[0].content.parts[0].text.trim();
  
  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  } else {
    return JSON.parse(content);
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
    // Update AI Provider
    if (request.config.aiProvider !== undefined) {
      CONFIG.aiProvider = request.config.aiProvider;
    }
    
    // Update Gemini API key
    if (request.config.geminiKey !== undefined) {
      CONFIG.gemini.apiKey = request.config.geminiKey;
    }
    
    // Update OpenAI API key
    if (request.config.openaiKey !== undefined) {
      CONFIG.openai.apiKey = request.config.openaiKey;
    }
    
    // Update LanguageTool enabled state
    if (request.config.languageToolEnabled !== undefined) {
      CONFIG.languageTool.enabled = request.config.languageToolEnabled;
    }
    
    // Update premium status
    if (request.config.licenseKey !== undefined) {
      validateLicense(request.config.licenseKey);
    }
    
    sendResponse({ success: true });
  }
});

console.log('Clarify background service worker initialized');
