# Clarify - AI Reading Assistant

**Fix grammar, summarize articles, and analyze privacy policies with AI**

Clarify is a Chrome extension that makes reading and writing online faster and safer using artificial intelligence.

---

## Features

### 1. Grammar Guardian
- **Real-time grammar checking** as you type
- Works on Gmail, Twitter, LinkedIn, Reddit, and any text input
- Powered by LanguageTool API (free tier available)
- Smart debouncing (checks after you stop typing, not every keystroke)
- Inline corrections with one-click fixes

### 2. Smart Summarizer
- **Summarize long articles** in seconds
- 3 modes: Quick (3 sentences), Detailed (key points), ELI5 (simple)
- Auto-detects articles on webpages
- Shows estimated reading time saved
- Powered by OpenAI GPT-4

### 3. Policy Detective
- **Analyzes privacy policies** for red flags
- Detects: data selling, surveillance, auto-renewal, liability waivers
- Risk scoring (low/medium/high)
- Plain English explanations
- Compares policies to industry standards

---

## Installation

### From Source (Development)

1. **Clone or download** this repository
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable "Developer mode"** (toggle in top-right)
4. **Click "Load unpacked"** and select the `Clarify` folder
5. **Pin the extension** to your toolbar

### Configuration

1. Click the Clarify icon → Settings
2. Add your **OpenAI API key** (get one at [platform.openai.com](https://platform.openai.com/api-keys))
3. Toggle features on/off as needed
4. Start using!

---

## Usage

### Grammar Checking
1. Type in any text field (Gmail, Twitter, etc.)
2. Grammar errors appear with red underlines
3. Hover to see suggestions
4. Click to fix instantly

### Summarizing Articles
1. Navigate to any article/blog post
2. Click the Clarify icon
3. Choose summary type (Quick/Detailed/ELI5)
4. Read the summary in seconds

### Policy Analysis
1. Visit a privacy policy page
2. Click the Clarify icon
3. Click "Policy Detective"
4. Review red flags and risk assessment

---

## Technical Details

### Architecture
- **Manifest V3** Chrome extension
- **Background Service Worker** handles API calls
- **Content Scripts** inject into webpages
- **Popup UI** for quick access
- **Options Page** for settings

### APIs Used
- **LanguageTool** (grammar checking) - Free tier: 20 requests/day
- **OpenAI GPT-4** (summarization & policy analysis) - Paid

### Cost Estimates
- Grammar checking: **Free** (LanguageTool free tier)
- Article summary: **~$0.001** per article
- Policy analysis: **~$0.05** per policy

---

## Privacy

**Clarify is privacy-first:**
- ✅ No data collection
- ✅ No analytics or tracking
- ✅ Your API key stays local (never sent to us)
- ✅ Direct API calls (no middleman servers)
- ✅ Open source (audit the code yourself)

**What gets sent to APIs:**
- **LanguageTool**: Text you're checking (deleted after check)
- **OpenAI**: Article text or policy text (not stored by default)

---

## Development

### Project Structure
```
Clarify/
├── manifest.json        # Extension configuration
├── background.js        # API handlers, message routing
├── content.js           # Webpage interaction, detection
├── content.css          # Injected styles
├── popup.html           # Extension popup UI
├── popup.js             # Popup logic
├── options.html         # Settings page
├── options.js           # Settings logic
└── icons/               # Extension icons
```

### Building

No build step required - this is pure JavaScript.

### Testing

1. Make changes to code
2. Go to `chrome://extensions/`
3. Click "Reload" on the Clarify extension
4. Test on a webpage

---

## Limitations

- **Grammar checking**: Limited to LanguageTool free tier (20/day) unless you upgrade
- **Summarization**: Requires OpenAI API key (costs money)
- **Policy analysis**: Requires OpenAI API key (costs money)
- **Article detection**: May not work on all sites (depends on HTML structure)
- **Browser support**: Chrome/Edge only (Manifest V3)

---

## Roadmap

- [ ] Visual grammar error markers
- [ ] Custom policy red flag rules
- [ ] Export summaries to Notion/Google Docs
- [ ] Browser extension for Firefox
- [ ] Offline mode with local AI models
- [ ] Team collaboration features
- [ ] Mobile app version

---

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## License

MIT License - See LICENSE file for details

---

## Support

- **Issues**: Report bugs on GitHub
- **Questions**: Open a discussion
- **Feature requests**: Submit an issue

---

## Credits

Built with:
- [LanguageTool API](https://languagetool.org/)
- [OpenAI GPT-4](https://openai.com/)
- Chrome Extensions API

---

**Made for better reading and writing online**
