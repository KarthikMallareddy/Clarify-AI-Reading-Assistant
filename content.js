/**
 * Content Script
 * Runs on every webpage, detects inputs and articles, adds grammar checking
 */

console.log('Clarify content script loaded');

// State
let isGrammarEnabled = true;
let debounceTimer = null;
let currentErrors = [];

// Load settings
chrome.storage.sync.get(['grammarEnabled'], (result) => {
  isGrammarEnabled = result.grammarEnabled !== false;
});

/**
 * Grammar Checker for Input Fields
 * Monitors textareas and contenteditable elements
 */
class GrammarChecker {
  constructor() {
    this.activeElement = null;
    this.errorMarkers = [];
  }

  init() {
    // Monitor all text inputs on page load
    this.scanForInputs();
    
    // Monitor new inputs added dynamically
    const observer = new MutationObserver(() => {
      this.scanForInputs();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also listen globally for focus events
    document.addEventListener('focusin', (e) => {
      const elem = e.target;
      if (this.isTextInput(elem)) {
        this.activeElement = elem;
        this.attachToInput(elem);
      }
    });

    console.log('Grammar checker initialized');
  }
  
  scanForInputs() {
    // Find all existing text inputs
    const inputs = document.querySelectorAll('input[type="text"], input[type="search"], textarea, [contenteditable="true"]');
    inputs.forEach(input => {
      if (!input.dataset.clarifyAttached) {
        input.dataset.clarifyAttached = 'true';
        this.attachToInput(input);
      }
    });
  }

  isTextInput(elem) {
    return (
      elem.tagName === 'TEXTAREA' ||
      elem.contentEditable === 'true' ||
      (elem.tagName === 'INPUT' && (elem.type === 'text' || elem.type === 'search'))
    );
  }

  attachToInput(elem) {
    // Add input listener with debouncing
    elem.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      
      // Wait 500ms after user stops typing
      debounceTimer = setTimeout(() => {
        this.checkText(elem);
      }, 500);
    });
  }

  async checkText(elem) {
    if (!isGrammarEnabled) return;

    const text = elem.value || elem.innerText || elem.textContent || '';
    
    if (!text || text.length < 5) return; // Too short to check

    console.log('Checking grammar for:', text.substring(0, 50) + '...');

    // Send to background for checking
    chrome.runtime.sendMessage(
      { action: 'checkGrammar', text },
      (response) => {
        if (response && response.errors) {
          console.log(`Found ${response.errors.length} grammar errors:`, response.errors);
          this.displayErrors(elem, response.errors);
        } else if (response && response.error) {
          console.log('Grammar check error:', response.error);
        }
      }
    );
  }

  displayErrors(elem, errors) {
    // Clear old markers
    this.clearMarkers();

    if (errors.length === 0) return;

    // Create error indicators
    errors.forEach(error => {
      // For now, just log - we'll add visual markers next
      console.log(`Grammar error: ${error.message} at position ${error.offset}`);
    });

    currentErrors = errors;
  }

  clearMarkers() {
    this.errorMarkers.forEach(marker => marker.remove());
    this.errorMarkers = [];
  }
}

/**
 * Article Detector
 * Finds article content for summarization
 */
class ArticleDetector {
  static detectArticle() {
    // Try common article selectors
    const selectors = [
      'article',
      '[role="article"]',
      '.article-content',
      '.post-content',
      'main article',
      '.entry-content'
    ];

    for (let selector of selectors) {
      const elem = document.querySelector(selector);
      if (elem && elem.innerText.length > 500) {
        return elem.innerText;
      }
    }

    // Fallback: find largest text block
    const paragraphs = Array.from(document.querySelectorAll('p'));
    const textBlocks = paragraphs
      .map(p => p.innerText)
      .filter(text => text.length > 100);

    if (textBlocks.length > 3) {
      return textBlocks.join('\n\n');
    }

    return null;
  }

  static estimateReadingTime(text) {
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
  }
}

/**
 * Policy Detector
 * Identifies privacy policy pages
 */
class PolicyDetector {
  static isPolicyPage() {
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    
    const keywords = [
      'privacy policy',
      'terms of service',
      'terms and conditions',
      'user agreement',
      'privacy notice',
      'cookie policy'
    ];

    return keywords.some(keyword => 
      url.includes(keyword.replace(/\s/g, '-')) ||
      url.includes(keyword.replace(/\s/g, '_')) ||
      title.includes(keyword)
    );
  }

  static extractPolicy() {
    // Try to get the full policy text
    const article = ArticleDetector.detectArticle();
    if (article) return article;

    // Fallback: get all visible text
    return document.body.innerText;
  }
}

/**
 * Initialize extension features
 */
function init() {
  // Start grammar checker
  const grammarChecker = new GrammarChecker();
  grammarChecker.init();

  // Detect if this is an article page
  const articleText = ArticleDetector.detectArticle();
  if (articleText) {
    const readingTime = ArticleDetector.estimateReadingTime(articleText);
    console.log(`Article detected: ${readingTime} min read`);
    
    // Update badge to show article is available
    chrome.runtime.sendMessage({
      action: 'articleDetected',
      readingTime
    });
  }

  // Detect if this is a policy page
  if (PolicyDetector.isPolicyPage()) {
    console.log('Privacy policy page detected');
    
    chrome.runtime.sendMessage({
      action: 'policyDetected'
    });
  }
}

// Start when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getArticle') {
    const article = ArticleDetector.detectArticle();
    sendResponse({ article });
  }
  
  if (request.action === 'getPolicy') {
    const policy = PolicyDetector.extractPolicy();
    sendResponse({ policy });
  }
  
  if (request.action === 'toggleGrammar') {
    isGrammarEnabled = request.enabled;
    sendResponse({ success: true });
  }
});
