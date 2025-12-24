/**
 * Options Page Script
 * Handles settings page interactions and storage
 */

// DOM Elements
const openaiKeyInput = document.getElementById('openai-key');
const grammarToggle = document.getElementById('grammar-toggle');
const articleToggle = document.getElementById('article-toggle');
const policyToggle = document.getElementById('policy-toggle');
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');
const clearStatsBtn = document.getElementById('clear-stats-btn');
const alertBox = document.getElementById('alert');

// Stat elements
const grammarStat = document.getElementById('grammar-stat');
const summaryStat = document.getElementById('summary-stat');
const policyStat = document.getElementById('policy-stat');

/**
 * Load saved settings
 */
function loadSettings() {
  chrome.storage.sync.get([
    'openaiKey',
    'grammarEnabled',
    'articleDetection',
    'policyWarnings'
  ], (result) => {
    // API Key
    if (result.openaiKey) {
      openaiKeyInput.value = result.openaiKey;
    }

    // Toggles
    setToggleState(grammarToggle, result.grammarEnabled !== false);
    setToggleState(articleToggle, result.articleDetection !== false);
    setToggleState(policyWarnings, result.policyWarnings !== false);
  });

  // Load stats
  loadStats();
}

/**
 * Load usage statistics
 */
function loadStats() {
  chrome.storage.local.get(['grammarChecks', 'summaries', 'policies'], (result) => {
    grammarStat.textContent = result.grammarChecks || 0;
    summaryStat.textContent = result.summaries || 0;
    policyStat.textContent = result.policies || 0;
  });
}

/**
 * Save settings
 */
function saveSettings() {
  const settings = {
    openaiKey: openaiKeyInput.value.trim(),
    grammarEnabled: grammarToggle.classList.contains('active'),
    articleDetection: articleToggle.classList.contains('active'),
    policyWarnings: policyToggle.classList.contains('active')
  };

  chrome.storage.sync.set(settings, () => {
    // Update background script config
    chrome.runtime.sendMessage({
      action: 'updateConfig',
      config: {
        openaiKey: settings.openaiKey,
        languageToolEnabled: settings.grammarEnabled
      }
    });

    showAlert('Settings saved successfully!', 'success');
  });
}

/**
 * Reset to default settings
 */
function resetSettings() {
  if (!confirm('Reset all settings to defaults?')) return;

  const defaults = {
    openaiKey: '',
    grammarEnabled: true,
    articleDetection: true,
    policyWarnings: true
  };

  chrome.storage.sync.set(defaults, () => {
    openaiKeyInput.value = '';
    setToggleState(grammarToggle, true);
    setToggleState(articleToggle, true);
    setToggleState(policyToggle, true);

    showAlert('Settings reset to defaults', 'success');
  });
}

/**
 * Clear statistics
 */
function clearStats() {
  if (!confirm('Clear all usage statistics?')) return;

  chrome.storage.local.set({
    grammarChecks: 0,
    summaries: 0,
    policies: 0
  }, () => {
    loadStats();
    showAlert('Statistics cleared', 'success');
  });
}

/**
 * Set toggle state
 */
function setToggleState(toggle, isActive) {
  if (isActive) {
    toggle.classList.add('active');
  } else {
    toggle.classList.remove('active');
  }
}

/**
 * Show alert message
 */
function showAlert(message, type) {
  alertBox.textContent = message;
  alertBox.className = `alert ${type}`;
  alertBox.style.display = 'block';

  setTimeout(() => {
    alertBox.style.display = 'none';
  }, 3000);
}

/**
 * Setup event listeners
 */
function setupListeners() {
  // Toggle clicks
  [grammarToggle, articleToggle, policyToggle].forEach(toggle => {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
    });
  });

  // Save button
  saveBtn.addEventListener('click', saveSettings);

  // Reset button
  resetBtn.addEventListener('click', resetSettings);

  // Clear stats button
  clearStatsBtn.addEventListener('click', clearStats);

  // Auto-save API key on blur
  openaiKeyInput.addEventListener('blur', () => {
    if (openaiKeyInput.value.trim().startsWith('sk-')) {
      saveSettings();
    }
  });
}

// Initialize
loadSettings();
setupListeners();
