# Clarify Extension - Quick Start

## 🚀 You're Ready to Test!

All files have been created. Follow these steps:

### Load Extension in Chrome

1. **Open Chrome** and navigate to: `chrome://extensions/`

2. **Enable Developer Mode**
   - Look for toggle switch in top-right corner
   - Click to enable

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to: `C:\Users\ASUS\Downloads\Clarify`
   - Click "Select Folder"

4. **Pin to Toolbar**
   - Click the puzzle piece icon in Chrome toolbar
   - Find "Clarify - AI Reading Assistant"
   - Click the pin icon to keep it visible

### Test the Extension

1. **Open Test Page**
   - Navigate to: `file:///C:/Users/ASUS/Downloads/Clarify/test-page.html`
   - Or open the file directly in Chrome

2. **Open Developer Console**
   - Press `F12` or right-click → Inspect
   - Click "Console" tab
   - You should see: "Clarify content script loaded"

3. **Test Grammar Checking**
   - Type in any textarea: "Your the best!"
   - Wait 500ms (pause typing)
   - Check console - should log grammar error detected
   - Error: "your → you're"

4. **Test Article Detection**
   - Click the Clarify extension icon
   - Should show: "✓ Article ready to summarize" (green text)

5. **Test Settings**
   - Click extension icon
   - Click "Settings" button
   - Settings page should open
   - Toggle switches should work

### What Works Without API Key

✅ **Grammar checking** (uses free LanguageTool API)
✅ **Article detection** (local detection)
✅ **Extension popup** (all UI features)
✅ **Settings page** (save/load settings)

### What Needs API Key

❌ **Summarization** (requires OpenAI API key)
❌ **Policy analysis** (requires OpenAI API key)

To add API key:
1. Get one at: https://platform.openai.com/api-keys
2. Extension icon → Settings → paste key → Save

### Expected Console Output

```
Clarify content script loaded
Grammar checker initialized
Article detected: 5 min read
```

### Troubleshooting

**Extension won't load?**
- Check all files exist
- Make sure icons folder has PNG files
- Reload extension at chrome://extensions/

**No console output?**
- Refresh the page
- Check "Errors" tab in chrome://extensions/
- Make sure Developer Mode is ON

**Grammar not working?**
- Type in a textarea
- WAIT 500ms after typing
- Check console for API calls

### Next Steps

Once loaded and testing:
1. Try on real websites (Twitter, Reddit, Medium)
2. Test summarizer (needs API key)
3. Visit a privacy policy page
4. Report any issues or errors

---

**Extension is ready! Load it in Chrome and start testing!**
