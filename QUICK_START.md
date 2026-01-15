# 🚀 Quick Start Guide - AI Email & Scheduling

## ⚡ 3-Minute Setup

### Step 1: Get Resend API Key
1. Visit: https://resend.com
2. Sign up (free)
3. Copy API key

### Step 2: Add to Netlify
1. Netlify → Site Settings → Environment Variables
2. Add: `RESEND_API_KEY` = your_key_here
3. Save

### Step 3: Deploy
```bash
git add .
git commit -m "Add email and scheduling features"
git push
```

Done! ✅

---

## 🧪 Quick Test

1. Go to your avatar page
2. Say: **"I want to contact you"**
3. Provide test name/email
4. Click **"Send Message"**
5. Check your inbox!

---

## 📋 What You Got

### 3 New Features:

1. **📧 Visitor → You**: Messages sent to your inbox
2. **📄 You → Visitor**: Send resume via email
3. **📅 Scheduling**: Generate Calendly links

---

## 🎯 Example Queries to Test

- "I'm interested in working with you"
- "Can you send me your resume?"
- "Let's schedule a call"
- "I'd like to discuss a job opportunity"
- "Send me your CV at myemail@company.com"

---

## 📁 Important Files

- `AI_ASSISTANT_SETUP.md` - Full setup instructions
- `TESTING_GUIDE.md` - Comprehensive test scenarios
- `IMPLEMENTATION_SUMMARY.md` - Technical details

---

## 🆘 Troubleshooting

**Email not received?**
- Check spam folder
- Verify Resend API key in Netlify
- Redeploy site

**Calendly not working?**
- Works without API token (uses fallback URLs)
- Add `CALENDLY_USER=dishasawantt` to env vars

---

## 📊 What Happens

```
User: "I want to hire you"
  ↓
AI: "What's your email?"
  ↓
User: "john@google.com"
  ↓
AI: [Shows draft]
  ↓
User: [Clicks Send]
  ↓
✉️ Email arrives in your inbox
✅ Reply goes to john@google.com
```

---

## 💰 Cost

**Free Tier:**
- 100 emails/day (Resend)
- Unlimited scheduling links (Calendly)

**Paid (if needed later):**
- Resend: $20/month for 50k emails
- Custom domain: $12/year

---

## ✅ Checklist

- [ ] Get Resend API key
- [ ] Add to Netlify env vars
- [ ] Deploy site
- [ ] Test: Send message
- [ ] Test: Send resume
- [ ] Test: Schedule meeting
- [ ] Check inbox for test emails

---

**Need more info?** Read the full documentation files!

**Ready to go?** Just add that API key and deploy! 🎉

