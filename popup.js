/**
 * Popup Script
 * Handles popup UI interactions and triggers features
 */

// DOM elements
const grammarCard = document.getElementById('grammar-card');
const summarizeCard = document.getElementById('summarize-card');
const policyCard = document.getElementById('policy-card');
const settingsBtn = document.getElementById('settings-btn');
const premiumBadge = document.getElementById('premium-badge');
const freeBadge = document.getElementById('free-badge');

// Status elements
const grammarStatus = document.getElementById('grammar-status');
const summarizeStatus = document.getElementById('summarize-status');
const policyStatus = document.getElementById('policy-status');

// Stats
const grammarCount = document.getElementById('grammar-count');
const summaryCount = document.getElementById('summary-count');
const policyCount = document.getElementById('policy-count');

// State
let currentTab = null;
let articleText = null;
let policyText = null;

/**
 * Initialize popup
 */
async function init() {
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  // Load stats
  loadStats();
  
  // Check premium status
  checkPremiumStatus();

  // Check what's available on this page
  checkPageCapabilities();

  // Setup event listeners
  setupListeners();
}

/**
 * Check and display premium status
 */
function checkPremiumStatus() {
  chrome.storage.sync.get(['licenseKey'], (result) => {
    const isPremium = result.licenseKey && result.licenseKey.startsWith('CLARIFY-PRO-');
    
    if (isPremium) {
      premiumBadge.style.display = 'block';
      freeBadge.style.display = 'none';
    } else {
      premiumBadge.style.display = 'none';
      freeBadge.style.display = 'block';
    }
  });
}

/**
 * Load usage statistics
 */
function loadStats() {
  chrome.storage.local.get(['grammarChecks', 'summaries', 'policies'], (result) => {
    grammarCount.textContent = result.grammarChecks || 0;
    summaryCount.textContent = result.summaries || 0;
    policyCount.textContent = result.policies || 0;
  });
}

/**
 * Check what features are available on current page
 */
async function checkPageCapabilities() {
  // Check if there's an article
  chrome.tabs.sendMessage(currentTab.id, { action: 'getArticle' }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('Content script not ready yet');
      return;
    }

    if (response && response.article) {
      articleText = response.article;
      summarizeStatus.textContent = '✓ Article ready to summarize';
      summarizeStatus.style.color = '#4CAF50';
      summarizeCard.classList.remove('disabled');
    } else {
      summarizeCard.classList.add('disabled');
    }
  });

  // Check if this is a policy page
  chrome.tabs.sendMessage(currentTab.id, { action: 'getPolicy' }, (response) => {
    if (chrome.runtime.lastError) return;

    if (response && response.policy && response.policy.length > 500) {
      policyText = response.policy;
      policyStatus.textContent = '✓ Policy detected';
      policyStatus.style.color = '#FF9800';
      policyCard.classList.remove('disabled');
    } else {
      policyCard.classList.add('disabled');
    }
  });
}

/**
 * Setup event listeners
 */
function setupListeners() {
  // Grammar card - toggle on/off
  grammarCard.addEventListener('click', () => {
    chrome.storage.sync.get(['grammarEnabled'], (result) => {
      const newState = !(result.grammarEnabled !== false);
      
      chrome.storage.sync.set({ grammarEnabled: newState }, () => {
        chrome.tabs.sendMessage(currentTab.id, { 
          action: 'toggleGrammar', 
          enabled: newState 
        });
        
        grammarStatus.textContent = newState ? 'Active on this page' : 'Disabled';
        grammarStatus.style.color = newState ? '#4CAF50' : '#999';
      });
    });
  });

  // Summarize card - open summary modal
  summarizeCard.addEventListener('click', () => {
    if (!articleText) return;
    
    showSummaryModal();
  });

  // Policy card - analyze policy
  policyCard.addEventListener('click', () => {
    if (!policyText) return;
    
    showPolicyModal();
  });

  // Settings button
  settingsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

/**
 * Show summary modal
 */
function showSummaryModal() {
  const modal = createModal();
  
  modal.innerHTML = `
    <div style="padding: 24px;">
      <h2 style="margin-bottom: 16px;">Summarize Article</h2>
      <p style="margin-bottom: 20px; color: #666;">Choose summary type:</p>
      
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button class="summary-btn" data-mode="quick">
          ⚡ Quick Summary (3 sentences)
        </button>
        <button class="summary-btn" data-mode="detailed">
          📋 Detailed Summary (key points)
        </button>
        <button class="summary-btn" data-mode="eli5">
          👶 Explain Like I'm 5
        </button>
      </div>
      
      <div id="summary-result" style="margin-top: 20px; display: none;">
        <div class="loading">
          <div class="spinner"></div>
          <div>Generating summary...</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Handle summary type selection
  modal.querySelectorAll('.summary-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const mode = btn.dataset.mode;
      const resultDiv = modal.querySelector('#summary-result');
      resultDiv.style.display = 'block';

      // Call background to summarize
      chrome.runtime.sendMessage({
        action: 'summarize',
        text: articleText,
        mode
      }, (response) => {
        if (response.error) {
          resultDiv.innerHTML = `<div style="color: red;">Error: ${response.error}</div>`;
        } else {
          resultDiv.innerHTML = `
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; color: #333;">
              ${response.summary.replace(/\n/g, '<br>')}
            </div>
            <div style="margin-top: 12px; font-size: 12px; color: #999;">
              Tokens used: ${response.tokens}
            </div>
          `;

          // Update stats
          incrementStat('summaries');
        }
      });
    });
  });
}

/**
 * Show policy analysis modal
 */
function showPolicyModal() {
  const modal = createModal();
  
  modal.innerHTML = `
    <div style="padding: 24px;">
      <h2 style="margin-bottom: 16px;">🔍 Analyzing Privacy Policy...</h2>
      <div class="loading">
        <div class="spinner"></div>
        <div>This may take 10-15 seconds...</div>
      </div>
      <div id="policy-result"></div>
    </div>
  `;

  document.body.appendChild(modal);

  // Analyze policy
  chrome.runtime.sendMessage({
    action: 'analyzePolicy',
    text: policyText
  }, (response) => {
    const resultDiv = modal.querySelector('#policy-result');
    const loadingDiv = modal.querySelector('.loading');
    loadingDiv.style.display = 'none';

    if (response.error) {
      resultDiv.innerHTML = `<div style="color: red;">Error: ${response.error}</div>`;
    } else {
      displayPolicyResults(resultDiv, response);
      incrementStat('policies');
    }
  });
}

/**
 * Display policy analysis results
 */
function displayPolicyResults(container, analysis) {
  const riskColors = {
    low: '#4CAF50',
    medium: '#FF9800',
    high: '#F44336'
  };

  let html = `
    <div style="margin-bottom: 20px; padding: 16px; background: ${riskColors[analysis.riskLevel]}; color: white; border-radius: 8px;">
      <strong>Risk Level: ${analysis.riskLevel.toUpperCase()}</strong>
    </div>
  `;

  if (analysis.redFlags && analysis.redFlags.length > 0) {
    html += `<h3 style="color: #F44336; margin-bottom: 12px;">⚠️ ${analysis.redFlags.length} Red Flags Found</h3>`;
    
    analysis.redFlags.forEach((flag, i) => {
      html += `
        <div style="background: #fff3cd; border-left: 4px solid #ff9800; padding: 12px; margin-bottom: 12px; border-radius: 4px; color: #333;">
          <strong style="color: #F44336;">${i + 1}. ${flag.category.toUpperCase()}</strong>
          <p style="margin: 8px 0; font-size: 13px;">"${flag.clause}"</p>
          <p style="margin: 8px 0; color: #666; font-size: 13px;">
            <strong>Plain English:</strong> ${flag.plainEnglish}
          </p>
        </div>
      `;
    });
  }

  html += `
    <div style="margin-top: 20px; padding: 16px; background: #f5f5f5; border-radius: 8px; color: #333;">
      <strong>Summary:</strong>
      <p style="margin-top: 8px;">${analysis.summary}</p>
    </div>
  `;

  container.innerHTML = html;
}

/**
 * Create modal overlay
 */
function createModal() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.8);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    border-radius: 12px;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  `;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  overlay.appendChild(modal);
  return overlay;
}

/**
 * Increment usage stat
 */
function incrementStat(key) {
  chrome.storage.local.get([key], (result) => {
    const newValue = (result[key] || 0) + 1;
    chrome.storage.local.set({ [key]: newValue }, () => {
      loadStats();
    });
  });
}

// Add styles for buttons
const style = document.createElement('style');
style.textContent = `
  .summary-btn {
    padding: 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 15px;
    font-weight: 500;
    transition: transform 0.2s;
  }
  .summary-btn:hover {
    transform: translateY(-2px);
  }
`;
document.head.appendChild(style);

// Initialize
init();
