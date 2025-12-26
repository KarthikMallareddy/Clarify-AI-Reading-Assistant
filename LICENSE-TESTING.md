# Premium License Testing Guide

## Test License Keys

### Valid Premium Keys
- `CLARIFY-PRO-TEST-1234-5678`
- `CLARIFY-PRO-DEMO-ABCD-EFGH`
- `CLARIFY-PRO-2024-USER-0001`

### Invalid Keys
- `CLARIFY-FREE-TEST-1234` (wrong prefix)
- `PREMIUM-TEST-1234` (wrong format)
- `clarify-pro-test` (case sensitive)

## Testing Steps

### 1. Test Free Tier (No License)
1. Open extension options page
2. Leave "License Key" field empty
3. Click "Save Settings"
4. Open popup - should show "FREE TIER" badge
5. Test grammar on page with "Their going to the store"
   - Should show RED error chip (LanguageTool only)
   - AI fallback should NOT activate

### 2. Test Invalid License
1. Open extension options page
2. Enter invalid key: `WRONG-KEY-123`
3. Click "Save Settings"
4. Should see red error message: "❌ Invalid license key"
5. Popup should still show "FREE TIER" badge
6. AI features should remain disabled

### 3. Test Valid Premium License
1. Open extension options page
2. Enter valid key: `CLARIFY-PRO-TEST-1234-5678`
3. Click "Save Settings"
4. Should see green success message: "✅ Premium Active! AI grammar checking enabled"
5. Open popup - should show "✨ PREMIUM ACTIVE" badge
6. Test grammar on page with "Their going to the store"
   - If LanguageTool misses it, AI should catch it
   - Should show BLUE error chip with ✨ badge (AI detection)

### 4. Test Settings Persistence
1. Set premium license
2. Close and reopen browser
3. Open popup - premium badge should still show
4. Open options - license key should be saved
5. Check console: "Premium license activated" on background load

### 5. Test Reset Functionality
1. Set premium license
2. Click "Reset to Defaults" in options
3. Confirm reset
4. License should clear
5. Popup should show "FREE TIER" badge
6. Premium status should disappear

## Expected Behavior

### Free Tier Features
✅ LanguageTool grammar checking
✅ Basic error detection
✅ Click-to-correct
❌ AI-powered fallback
❌ Advanced grammar detection

### Premium Tier Features
✅ LanguageTool grammar checking
✅ Basic error detection
✅ Click-to-correct
✅ AI-powered fallback (GPT-4o-mini)
✅ Advanced grammar detection
✅ "Their/They're/There" detection
✅ Blue chip styling with ✨ badge

## API Key Requirements

### For Premium Users
- License Key: Required (CLARIFY-PRO-*)
- OpenAI API Key: Optional (admin provides)

If no OpenAI API key is configured:
- AI fallback will not work
- Premium users still get LanguageTool only
- Console shows: "AI check skipped - no API key"

## Console Messages to Watch

### Premium Activation
```
Premium license activated
```

### Free Tier
```
Free tier - AI features disabled
```

### AI Fallback Trigger
```
AI fallback - checking with GPT-4o-mini
```

### AI Detection Success
```
AI found 1 errors
```

## Security Notes

⚠️ Current Implementation:
- Client-side validation only
- License format: `CLARIFY-PRO-*`
- No server verification

🔒 Production Requirements:
- Server-side license validation
- Database of valid keys
- Expiration dates
- Usage limits
- Subscription status checks
