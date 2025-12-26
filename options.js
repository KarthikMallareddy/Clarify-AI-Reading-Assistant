/**
 * Options Page Script
 * Handles settings page interactions and storage
 */

// DOM Elements
const licenseKeyInput = document.getElementById('license-key');
const licenseStatus = document.getElementById('premium-status');
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
    'licenseKey',
    'openaiKey',
    'grammarEnabled',
    'articleDetection',
    'policyWarnings'
  ], (result) => {
    // License Key
    if (result.licenseKey) {
      licenseKeyInput.value = result.licenseKey;
      validateAndShowLicense(result.licenseKey);
    }
    
    // API Key
    if (result.openaiKey) {
      openaiKeyInput.value = result.openaiKey;
    }

    // Toggles
    setToggleState(grammarToggle, result.grammarEnabled !== false);
    setToggleState(articleToggle, result.articleDetection !== false);
    setToggleState(policyToggle, result.policyWarnings !== false);
  });

  // Load stats
  loadStats();
}

/**
 * Validate and show license status
 */
function validateAndShowLicense(licenseKey) {
  if (!licenseKey) {
    licenseStatus.style.display = 'none';
    return;
  }
  
  const isValid = licenseKey.startsWith('CLARIFY-PRO-');
  licenseStatus.style.display = 'block';
  
  if (isValid) {
    licenseStatus.style.background = '#d4edda';
    licenseStatus.style.color = '#155724';
    licenseStatus.style.border = '1px solid #c3e6cb';
    licenseStatus.innerHTML = '✅ <strong>Premium Active!</strong> AI grammar checking enabled.';
  } else {
    licenseStatus.style.background = '#f8d7da';
    licenseStatus.style.color = '#721c24';
    licenseStatus.style.border = '1px solid #f5c6cb';
    licenseStatus.innerHTML = '❌ Invalid license key. Please check and try again.';
  }
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
  const licenseKey = licenseKeyInput.value.trim();
  
  const settings = {
    licenseKey: licenseKey,
    openaiKey: openaiKeyInput.value.trim(),
    grammarEnabled: grammarToggle.classList.contains('active'),
    articleDetection: articleToggle.classList.contains('active'),
    policyWarnings: policyToggle.classList.contains('active')
  };

  chrome.storage.sync.set(settings, () => {
    // Validate and show license status
    validateAndShowLicense(licenseKey);
    
    // Update background script config
    const isPremium = licenseKey.startsWith('CLARIFY-PRO-');
    chrome.runtime.sendMessage({
      action: 'updateConfig',
      config: {
        licenseKey: licenseKey,
        openaiKey: settings.openaiKey,
        languageToolEnabled: settings.grammarEnabled,
        isPremium: isPremium
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
    licenseKey: '',
    openaiKey: '',
    grammarEnabled: true,
    articleDetection: true,
    policyWarnings: true
  };

  chrome.storage.sync.set(defaults, () => {
    licenseKeyInput.value = '';
    licenseStatus.style.display = 'none';
    openaiKeyInput.value = '';
    setToggleState(grammarToggle, true);
    setToggleState(articleToggle, true);
    setToggleState(policyToggle, true);

    // Update background config
    chrome.runtime.sendMessage({
      action: 'updateConfig',
      config: {
        licenseKey: '',
        openaiKey: '',
        languageToolEnabled: true,
        isPremium: false
      }
    });

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
