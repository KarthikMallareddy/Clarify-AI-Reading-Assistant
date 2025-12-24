# Clarify Extension - Testing Instructions

## Quick Setup (5 minutes)

### Step 1: Create Icon Files (Temporary)
Since we need icons for Chrome, run this in PowerShell from the Clarify folder:

```powershell
cd icons
# Create simple colored squares as placeholders
Add-Type -AssemblyName System.Drawing
$sizes = @(16, 48, 128)
foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(102, 126, 234))
    $graphics.FillRectangle($brush, 0, 0, $size, $size)
    $bmp.Save("icon$size.png")
    $graphics.Dispose()
    $bmp.Dispose()
}
```

**OR** Just create 3 empty PNG files named: `icon16.png`, `icon48.png`, `icon128.png` in the `icons/` folder

### Step 2: Load Extension in Chrome

1. **Open Chrome** and go to: `chrome://extensions/`
2. **Enable "Developer mode"** (toggle switch in top-right corner)
3. **Click "Load unpacked"** button
4. **Select** the `Clarify` folder (C:\Users\ASUS\Downloads\Clarify)
5. **Pin the extension** to toolbar (puzzle icon → pin)

### Step 3: Configure API Key (Optional)

**For grammar checking only:** Skip this (uses free LanguageTool API)

**For summarization & policy analysis:**
1. Get OpenAI API key at: https://platform.openai.com/api-keys
2. Click Clarify icon → Settings button
3. Paste API key
4. Click "Save Settings"

### Step 4: Test Features

#### Test Grammar Checking (No API key needed)
1. Open: `test-page.html` in Chrome
2. Type in the textarea: "Your the best!"
3. Wait 500ms (pause typing)
4. Check console (F12) for grammar errors logged
5. Should see: "Grammar error: your → you're"

#### Test Article Detection
1. While on test-page.html
2. Click Clarify icon
3. Should show: "✓ Article ready to summarize" (green text)

#### Test Summarization (Requires API key)
1. Click Clarify icon
2. Click "Smart Summarizer" card
3. Choose "Quick Summary"
4. Should generate 3-sentence summary

## Troubleshooting

### Extension won't load
- Check that all files are in the Clarify folder
- Make sure icons folder exists with PNG files
- Check Chrome DevTools for errors

### Grammar checking not working
- Open DevTools (F12) → Console tab
- Should see: "Clarify content script loaded"
- Type in a textarea and wait 500ms
- Check console for API calls

### Summarizer says "No article detected"
- Content script may not have loaded
- Refresh the page
- Check console for "Article detected" message

### "OpenAI API key not configured" error
- Go to Settings
- Add your API key (starts with `sk-`)
- Click Save Settings
- Try again

## What to Check

✅ **Extension appears** in chrome://extensions/
✅ **Icon shows** in toolbar (purple/blue gradient)
✅ **Popup opens** when clicking icon
✅ **Console shows** "Clarify content script loaded"
✅ **Test page** opens without errors
✅ **Typing** in textarea triggers debounce timer
✅ **Settings page** opens and saves

## Known Limitations (This is MVP)

⚠️ Grammar errors are logged to console (visual markers not implemented yet)
⚠️ Icons are placeholders (need proper design)
⚠️ Some websites may not work (Gmail, Google Docs need special handling)
⚠️ Policy detection only works on pages with "privacy" in URL/title

## Next Steps After Testing

1. Check browser console for any errors
2. Test on different websites (Twitter, Reddit, Medium)
3. Try the summarizer on news articles
4. Visit a privacy policy page and test Policy Detective
5. Report what works and what doesn't

## Quick Debug Commands

```javascript
// In console, check if content script loaded:
console.log('Content script active:', typeof window.clarify !== 'undefined');

// Check storage:
chrome.storage.sync.get(null, data => console.log('Settings:', data));
chrome.storage.local.get(null, data => console.log('Stats:', data));
```

---

**Ready to test? Load the extension and open test-page.html!**
