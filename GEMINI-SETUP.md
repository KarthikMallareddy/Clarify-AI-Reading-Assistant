# Google Gemini API Setup Guide

## ✅ Why Gemini?

**FREE Alternative to OpenAI:**
- ✅ No credit card required
- ✅ Free tier: 15 requests/minute, 1500/day
- ✅ Works with most banks/payment methods (if you upgrade later)
- ✅ Same AI quality for grammar checking

**vs OpenAI:**
- ❌ Requires billing setup
- ❌ Banks may block transactions
- ❌ More expensive ($0.25/1M tokens vs Gemini free)

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Your FREE Gemini API Key

1. **Go to**: https://aistudio.google.com/app/apikey
2. **Sign in** with your Google account
3. **Click "Create API Key"**
4. **Copy the key** (starts with `AIza...`)

### Step 2: Add to Clarify Extension

1. **Open Clarify** extension (click icon)
2. **Click Settings** (gear icon)
3. **Premium License section:**
   - Enter test key: `CLARIFY-PRO-TEST-1234-5678`
4. **API Configuration section:**
   - Select "Google Gemini" from dropdown
   - Paste your API key in "Google Gemini API Key" field
5. **Click "Save Settings"**
6. Should see: ✅ **Premium Active!**

### Step 3: Test It!

1. Go to any website (e.g., Gmail, Twitter)
2. Type in a text field: **"Their going to the store"**
3. Wait 1 second after typing
4. You should see a **blue chip** with ✨: `Their → They're`

---

## 📊 Gemini Free Tier Limits

**What you get for FREE:**
- **15 requests per minute**
- **1,500 requests per day**
- **32,000 tokens per request**

**Is this enough?**
- 1 grammar check = 1 request
- Average user: ~50-100 checks/day
- Free tier = plenty for personal use! 🎉

**If you hit limits:**
- Wait 1 minute (rate limit resets)
- Or wait until next day (daily limit resets)
- Or upgrade to paid (but not needed for testing)

---

## 🆚 Gemini vs OpenAI Comparison

| Feature | Google Gemini (Free) | OpenAI GPT |
|---------|---------------------|------------|
| **Cost** | FREE (15/min, 1500/day) | $0.25 per 1M tokens |
| **Billing** | No card needed | Credit card required |
| **Quality** | Excellent | Excellent |
| **Speed** | Fast | Fast |
| **Bank Issues** | None | Some banks block |
| **Best For** | Testing, personal use | High volume, production |

---

## 🎯 How It Works

```
User types text
    ↓
LanguageTool checks (free, fast)
    ↓
No errors found?
    ↓
Gemini AI checks (premium)
    ↓
Finds "Their" → "They're"
    ↓
Shows blue chip with ✨
```

---

## 🔧 Troubleshooting

### "No errors detected" but there are errors

**Check console** (F12):
- Look for: `Gemini API error`
- If you see error, check API key is correct
- If rate limit: wait 1 minute

### "Premium not active"

1. Check license key is: `CLARIFY-PRO-TEST-1234-5678`
2. Make sure it's in the TOP field (Premium License)
3. Click "Save Settings"
4. Should see green checkmark

### API key doesn't work

1. **Verify key** starts with `AIza`
2. **Check quotas** at: https://aistudio.google.com/app/apikey
3. **Try creating new key** if old one expired

---

## 💡 Pro Tips

### For Testing
- Use Gemini (free, no hassles)
- Test all features
- No payment needed

### For Production
- Gemini free tier is enough for 100s of users
- If you need more: upgrade to Gemini paid ($0.125/1M tokens)
- Or switch to OpenAI if you prefer

### Switching Providers
You can switch anytime:
1. Go to Settings
2. Change dropdown: "Google Gemini" ↔ "OpenAI GPT"
3. Enter corresponding API key
4. Save

Both work the same way!

---

## 📝 Summary

**What you just got:**
1. ✅ FREE AI grammar checking
2. ✅ No credit card needed
3. ✅ Works with any bank
4. ✅ Premium features unlocked
5. ✅ 1,500 checks per day

**Next steps:**
1. Get Gemini API key (2 minutes)
2. Add to extension settings
3. Test on "Their going to the store"
4. Enjoy AI grammar checking! 🎉

---

## 🔗 Useful Links

- **Get API Key**: https://aistudio.google.com/app/apikey
- **Gemini Docs**: https://ai.google.dev/
- **Check Quotas**: https://aistudio.google.com/app/apikey
- **Pricing**: https://ai.google.dev/pricing

---

## Need Help?

If you have issues:
1. Check browser console (F12) for errors
2. Verify API key is correct
3. Make sure premium license is active
4. Try reloading the extension

Enjoy your FREE AI-powered grammar checking! 🚀
