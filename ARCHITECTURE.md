# Premium Licensing Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                              │
└─────────────────────────────────────────────────────────────────┘

1. INSTALLATION
   │
   ├─> User installs Clarify extension
   │   │
   │   └─> Default: FREE TIER
   │       - LanguageTool only
   │       - Popup shows "FREE TIER" badge
   │

2. FREE TIER USAGE
   │
   ├─> User types in text field: "Their going to the store"
   │   │
   │   ├─> LanguageTool API check
   │   │   └─> No errors found (limitation)
   │   │
   │   └─> AI fallback SKIPPED (no license)
   │       └─> Console: "Free tier - AI features disabled"
   │

3. UPGRADE TO PREMIUM
   │
   ├─> User clicks Settings
   │   │
   │   ├─> Sees "Upgrade to Premium" link
   │   │   └─> Visits payment page (external)
   │   │       └─> Pays $4.99/month via Stripe
   │   │           └─> Receives license key: CLARIFY-PRO-XXXX-XXXX
   │   │
   │   └─> User enters license key in options
   │       │
   │       ├─> options.js: licenseKeyInput.value
   │       │
   │       ├─> Click "Save Settings"
   │       │   │
   │       │   ├─> chrome.storage.sync.set({ licenseKey })
   │       │   │
   │       │   ├─> validateAndShowLicense(key)
   │       │   │   └─> Green: "✅ Premium Active!"
   │       │   │
   │       │   └─> chrome.runtime.sendMessage({
   │       │         action: 'updateConfig',
   │       │         config: { licenseKey, isPremium: true }
   │       │       })
   │       │
   │       └─> background.js receives message
   │           └─> validateLicense(licenseKey)
   │               │
   │               ├─> Checks: licenseKey.startsWith('CLARIFY-PRO-')
   │               │
   │               └─> CONFIG.premium.isActive = true
   │

4. PREMIUM USAGE
   │
   ├─> User types: "Their going to the store"
   │   │
   │   ├─> content.js detects typing
   │   │   └─> Debounce 500ms
   │   │       └─> chrome.runtime.sendMessage({
   │   │             action: 'checkGrammar',
   │   │             text: "Their going to the store"
   │   │           })
   │   │
   │   └─> background.js: checkGrammar(text)
   │       │
   │       ├─> Step 1: checkWithLanguageTool(text)
   │       │   └─> LanguageTool API returns: [] (no errors)
   │       │
   │       ├─> Step 2: AI Fallback Check
   │       │   │
   │       │   ├─> if (CONFIG.premium.isActive && CONFIG.openai.apiKey)
   │       │   │   │
   │       │   │   └─> checkWithAI(text)
   │       │   │       │
   │       │   │       ├─> OpenAI API call with GPT-4o-mini
   │       │   │       │
   │       │   │       └─> Returns: [{
   │       │   │             error: "Their",
   │       │   │             correction: "They're",
   │       │   │             type: "Homophone confusion",
   │       │   │             explanation: "Use They're (they are)"
   │       │   │           }]
   │       │   │
   │       │   └─> else: Skip AI (free tier or no API key)
   │       │
   │       └─> Return errors to content.js
   │           └─> { errors: [...], source: 'AI' }
   │
   └─> content.js receives AI errors
       │
       └─> createErrorChips()
           │
           ├─> Creates BLUE chip below input
           │   └─> Style: background: #e3f2fd, border: #2196f3
           │       innerHTML: "✨ Their → They're"
           │
           └─> On click: applyCorrection()
               └─> Replaces "Their" with "They're"
                   └─> User sees: "They're going to the store"


┌─────────────────────────────────────────────────────────────────┐
│                     SYSTEM ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────┘

[User Types Text]
      │
      v
[Content Script: content.js]
  - Monitors input fields
  - Debounces typing (500ms)
  - Sends text to background
      │
      v
[Background Worker: background.js]
  - Checks premium status
  - Routes to LanguageTool
  - Routes to OpenAI (if premium)
      │
      ├──> [LanguageTool API] (Free)
      │    - Basic grammar rules
      │    - Fast, lightweight
      │    - 20 requests/day limit
      │
      └──> [OpenAI GPT-4o-mini] (Premium)
           - Advanced AI detection
           - Context-aware
           - Catches homophones
      │
      v
[Background Worker: background.js]
  - Combines/prioritizes errors
  - Returns to content script
      │
      v
[Content Script: content.js]
  - Creates error chips
  - Color codes by source
  - Handles corrections
      │
      v
[User Sees Corrections]
  - Red chip = LanguageTool
  - Blue chip ✨ = AI


┌─────────────────────────────────────────────────────────────────┐
│                     DATA FLOW                                    │
└─────────────────────────────────────────────────────────────────┘

OPTIONS PAGE SAVE:
┌─────────────┐
│ options.js  │ 
└─────┬───────┘
      │ saveSettings()
      │
      ├─> chrome.storage.sync.set({ licenseKey: "CLARIFY-PRO-..." })
      │
      └─> chrome.runtime.sendMessage({
            action: 'updateConfig',
            config: { licenseKey, isPremium: true }
          })
            │
            v
      ┌───────────────┐
      │ background.js │
      └───────┬───────┘
              │ onMessage handler
              │
              ├─> validateLicense(licenseKey)
              │   └─> CONFIG.premium.isActive = true
              │
              └─> Responds: { success: true }


EXTENSION STARTUP:
┌───────────────┐
│ background.js │
└───────┬───────┘
        │ On install/startup
        │
        └─> chrome.storage.sync.get(['licenseKey', ...])
            │
            ├─> validateLicense(result.licenseKey)
            │   └─> Sets CONFIG.premium.isActive
            │
            └─> Ready to handle grammar checks


POPUP DISPLAY:
┌──────────┐
│ popup.js │
└────┬─────┘
     │ init()
     │
     └─> checkPremiumStatus()
         │
         ├─> chrome.storage.sync.get(['licenseKey'])
         │
         └─> if (licenseKey.startsWith('CLARIFY-PRO-'))
             │
             ├─> premiumBadge.style.display = 'block'
             │   └─> Shows: "✨ PREMIUM ACTIVE"
             │
             └─> else: freeBadge.style.display = 'block'
                 └─> Shows: "FREE TIER"


┌─────────────────────────────────────────────────────────────────┐
│                 PREMIUM VALIDATION LOGIC                         │
└─────────────────────────────────────────────────────────────────┘

validateLicense(licenseKey):
  │
  ├─> if (!licenseKey)
  │   └─> CONFIG.premium.isActive = false
  │       └─> return false
  │
  ├─> if (licenseKey.startsWith('CLARIFY-PRO-'))
  │   │
  │   ├─> CONFIG.premium.isActive = true
  │   ├─> CONFIG.premium.licenseKey = licenseKey
  │   ├─> console.log('Premium license activated')
  │   └─> return true
  │
  └─> else
      └─> CONFIG.premium.isActive = false
          └─> console.log('Free tier - AI features disabled')
          └─> return false


AI Fallback Trigger:
checkGrammar(text):
  │
  ├─> ltErrors = await checkWithLanguageTool(text)
  │
  ├─> if (ltErrors.length > 0)
  │   └─> return { errors: ltErrors, source: 'LanguageTool' }
  │
  └─> if (CONFIG.premium.isActive && 
          CONFIG.openai.apiKey && 
          text.length > 10)
      │
      ├─> console.log('AI fallback - checking with GPT-4o-mini')
      │
      └─> aiErrors = await checkWithAI(text)
          └─> return { errors: aiErrors, source: 'AI' }


┌─────────────────────────────────────────────────────────────────┐
│                    COLOR CODING SYSTEM                           │
└─────────────────────────────────────────────────────────────────┘

LanguageTool Errors (Free):
  ┌──────────────────────────┐
  │  📝 grammer → grammar    │  <- RED background
  └──────────────────────────┘     Red border
       CSS: .error-chip
            background: #ffebee
            border: #f44336

AI Errors (Premium):
  ┌──────────────────────────┐
  │  ✨ Their → They're      │  <- BLUE background
  └──────────────────────────┘     Blue border
       CSS: .error-chip.ai-error
            background: #e3f2fd
            border: #2196f3
       HTML: <span class="ai-badge">✨</span>


┌─────────────────────────────────────────────────────────────────┐
│                    STORAGE SCHEMA                                │
└─────────────────────────────────────────────────────────────────┘

chrome.storage.sync:
{
  "licenseKey": "CLARIFY-PRO-TEST-1234-5678",
  "openaiKey": "sk-...",                      // Admin configures
  "grammarEnabled": true,
  "articleDetection": true,
  "policyWarnings": true
}

chrome.storage.local (stats):
{
  "grammarChecks": 142,
  "summaries": 28,
  "policies": 5
}


┌─────────────────────────────────────────────────────────────────┐
│                  MESSAGE PASSING                                 │
└─────────────────────────────────────────────────────────────────┘

1. Grammar Check Request:
   content.js -> background.js
   {
     action: 'checkGrammar',
     text: 'Their going to the store'
   }
   
   Response:
   {
     errors: [{
       offset: 0,
       length: 5,
       message: "Use They're (they are)",
       replacements: ["They're"]
     }],
     source: 'AI'
   }

2. Config Update:
   options.js -> background.js
   {
     action: 'updateConfig',
     config: {
       licenseKey: 'CLARIFY-PRO-...',
       openaiKey: 'sk-...',
       languageToolEnabled: true,
       isPremium: true
     }
   }
   
   Response:
   {
     success: true
   }
```

## Summary

The premium licensing system is fully functional with:

✅ **Client-side validation** (CLARIFY-PRO-* prefix check)
✅ **Premium gating** for AI features
✅ **Visual indicators** (badges, color-coded chips)
✅ **Settings persistence** via chrome.storage.sync
✅ **Seamless UX** (auto-activates on save)

⚠️ **Production TODO:**
- Server-side license validation API
- Payment integration (Stripe)
- Expiration date handling
- Device limits
- Subscription management dashboard
