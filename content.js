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
    // Prevent duplicate attachment
    if (elem.dataset.clarifyListenerAttached) return;
    elem.dataset.clarifyListenerAttached = 'true';
    
    // Add input listener with debouncing
    elem.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      
      // Don't clear errors while typing - only when new check completes
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

    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      console.log('Extension context invalidated. Please refresh the page.');
      return;
    }

    try {
      // Send to background for checking
      chrome.runtime.sendMessage(
        { action: 'checkGrammar', text },
        (response) => {
          // Check for runtime errors (extension reloaded)
          if (chrome.runtime.lastError) {
            console.log('Extension was reloaded. Please refresh this page.');
            return;
          }

          if (response && response.errors) {
            console.log(`Found ${response.errors.length} grammar errors:`, response.errors);
            this.displayErrors(elem, response.errors);
          } else if (response && response.error) {
            console.log('Grammar check error:', response.error);
          }
        }
      );
    } catch (error) {
      console.log('Extension context error. Please refresh the page.');
    }
  }

  displayErrors(elem, errors) {
    // Store current focus
    const wasFocused = document.activeElement === elem;
    const cursorPos = elem.selectionStart;
    
    // Only clear markers when updating with new results
    // This keeps errors visible while user continues typing
    this.clearMarkersForElement(elem);

    if (errors.length === 0) {
      currentErrors = [];
      return;
    }

    console.log(`Found ${errors.length} grammar errors`);

    // Show errors as clickable chips below the input
    this.createErrorChips(elem, errors);

    currentErrors = errors;
    
    // Restore focus if it was focused
    if (wasFocused) {
      elem.focus();
      if (cursorPos !== undefined && elem.setSelectionRange) {
        elem.setSelectionRange(cursorPos, cursorPos);
      }
    }
  }

  createErrorChips(elem, errors) {
    // Find or create container that won't interfere with the input
    let container = document.querySelector('.clarify-errors-container-' + this.getElementId(elem));
    
    if (!container) {
      container = document.createElement('div');
      container.className = 'clarify-errors-container clarify-errors-container-' + this.getElementId(elem);
      container.style.cssText = `
        margin-top: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        pointer-events: auto;
      `;
      
      // Insert after the element safely
      if (elem.nextSibling) {
        elem.parentNode.insertBefore(container, elem.nextSibling);
      } else {
        elem.parentNode.appendChild(container);
      }
    }

    container.innerHTML = '';

    const text = elem.value || elem.innerText || elem.textContent;

    errors.forEach((error, index) => {
      const errorText = text.substring(error.offset, error.offset + error.length);
      
      // Log error details for debugging
      console.log(`Error ${index + 1}: "${errorText}" - ${error.category || error.type} - ${error.message}`);
      
      // Determine if this is an AI-detected error
      const isAI = error.category && error.category.includes('AI');
      
      const chip = document.createElement('div');
      chip.className = 'clarify-error-chip';
      chip.style.cssText = `
        background: ${isAI ? '#e3f2fd' : '#ffebee'};
        border: 1px solid ${isAI ? '#2196F3' : '#ef5350'};
        border-radius: 16px;
        padding: 6px 12px;
        font-size: 13px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
        user-select: none;
      `;

      chip.innerHTML = `
        <span style="font-weight: 600; color: ${isAI ? '#1565c0' : '#c62828'};">${this.escapeHtml(errorText)}</span>
        <span style="color: #666;">→</span>
        <span style="color: #1976d2; font-weight: 500;">${error.replacements[0] || 'Fix'}</span>
        ${isAI ? '<span style="font-size: 10px; color: #1976d2; margin-left: 4px;">✨AI</span>' : ''}
      `;

      chip.addEventListener('mouseenter', () => {
        chip.style.background = isAI ? '#bbdefb' : '#ffcdd2';
        chip.style.transform = 'scale(1.02)';
      });

      chip.addEventListener('mouseleave', () => {
        chip.style.background = isAI ? '#e3f2fd' : '#ffebee';
        chip.style.transform = 'scale(1)';
      });

      chip.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showTooltip(chip, error, elem);
      });

      container.appendChild(chip);
      this.errorMarkers.push(chip);
    });

    this.errorMarkers.push(container);
  }

  getElementId(elem) {
    // Create a unique ID for the element
    if (!elem.dataset.clarifyId) {
      elem.dataset.clarifyId = 'elem-' + Math.random().toString(36).substr(2, 9);
    }
    return elem.dataset.clarifyId;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showTooltip(target, error, inputElem) {
    // Remove existing tooltip
    document.querySelectorAll('.clarify-tooltip').forEach(t => t.remove());

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'clarify-tooltip';

    const message = document.createElement('div');
    message.className = 'clarify-tooltip-message';
    message.textContent = error.message;
    tooltip.appendChild(message);

    if (error.replacements && error.replacements.length > 0) {
      const suggestionsDiv = document.createElement('div');
      suggestionsDiv.className = 'clarify-tooltip-suggestions';

      error.replacements.forEach(suggestion => {
        const suggestionBtn = document.createElement('div');
        suggestionBtn.className = 'clarify-suggestion';
        suggestionBtn.textContent = suggestion;
        suggestionBtn.addEventListener('click', () => {
          this.applyCorrection(inputElem, error.offset, error.length, suggestion);
          tooltip.remove();
        });
        suggestionsDiv.appendChild(suggestionBtn);
      });

      tooltip.appendChild(suggestionsDiv);
    }

    // Position tooltip
    const rect = target.getBoundingClientRect();
    tooltip.style.position = 'fixed';
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.bottom + 5) + 'px';

    document.body.appendChild(tooltip);

    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', function closeTooltip(e) {
        if (!tooltip.contains(e.target) && e.target !== target) {
          tooltip.remove();
          document.removeEventListener('click', closeTooltip);
        }
      });
    }, 100);
  }

  applyCorrection(elem, offset, length, replacement) {
    // Store cursor position
    const cursorPos = elem.selectionStart;
    
    const text = elem.value || elem.innerText || elem.textContent;
    const newText = text.substring(0, offset) + replacement + text.substring(offset + length);

    if (elem.value !== undefined) {
      elem.value = newText;
      // Set cursor after the replacement
      const newCursorPos = offset + replacement.length;
      elem.focus();
      elem.setSelectionRange(newCursorPos, newCursorPos);
    } else {
      elem.textContent = newText;
    }

    // Clear markers and re-check after a delay
    this.clearMarkersOnly();
    setTimeout(() => {
      this.checkText(elem);
    }, 100);
  }

  clearMarkersOnly() {
    // Only clear the chip elements, not containers
    this.errorMarkers.forEach(marker => {
      if (marker && marker.remove) {
        marker.remove();
      }
    });
    this.errorMarkers = [];
  }

  clearMarkersForElement(elem) {
    // Clear only markers for this specific element
    const elementId = this.getElementId(elem);
    const container = document.querySelector('.clarify-errors-container-' + elementId);
    if (container) {
      container.innerHTML = ''; // Clear chips but keep container
    }
  }

  clearMarkers() {
    this.clearMarkersOnly();
    
    // Remove any tooltips
    document.querySelectorAll('.clarify-tooltip').forEach(t => t.remove());
    
    // Remove all error containers
    document.querySelectorAll('.clarify-errors-container').forEach(c => c.remove());
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
