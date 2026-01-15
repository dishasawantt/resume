# AI Portfolio Assistant - Setup Guide

## 🎉 New Features Implemented

Your portfolio now has three powerful AI-driven email and scheduling capabilities:

### 1. 📧 Visitor Contact (Visitor → You)
Visitors can send messages to you through the chatbot. The AI will:
- Ask for their name and email
- Draft a professional message
- Send it directly to your inbox (dishasawantt@gmail.com)
- You can reply directly from your email

### 2. 📄 Document Sending (You → Visitor)
When visitors request your resume or documents:
- AI asks for their email
- Sends documents with a professional cover email
- Includes your portfolio links and Calendly
- Tracked with rate limiting (3 per day per person)

### 3. 📅 Meeting Scheduling
Visitors can schedule meetings with you:
- Quick Chat (15 min)
- Consultation (30 min)
- Interview (45 min)
- AI generates Calendly link instantly

---

## 🔧 Environment Variables Setup

You need to add these environment variables to Netlify:

### Required Variables:

1. **GROQ_API_KEY** (Already have this ✓)
   - Your existing Groq API key for the LLM

2. **RESEND_API_KEY** (New - Required)
   - Get it from: https://resend.com
   - Free tier: 100 emails/day
   - Used for sending emails

### Optional Variables:

3. **CALENDLY_API_TOKEN** (Optional but recommended)
   - Get it from: https://calendly.com/app/settings/developer
   - If not set, uses fallback URLs (still works!)

4. **CALENDLY_USER** (Optional)
   - Your Calendly username (e.g., "dishasawantt")
   - Default: "dishasawantt"

5. **URL** (Auto-detected in production)
   - Your Netlify site URL
   - Usually auto-detected, no need to set

---

## 📝 Step-by-Step Setup

### Step 1: Get Resend API Key

1. Go to https://resend.com
2. Sign up with your email
3. Verify your email address
4. Go to Dashboard → API Keys
5. Click "Create API Key"
6. Copy the key (starts with `re_...`)

### Step 2: Add to Netlify

1. Go to your Netlify dashboard
2. Select your portfolio site
3. Go to: **Site Settings → Environment Variables**
4. Click "Add a variable"
5. Add:
   - **Key:** `RESEND_API_KEY`
   - **Value:** `re_your_key_here`
6. Click "Save"

### Step 3: (Optional) Setup Calendly API

1. Go to https://calendly.com
2. Log in to your account
3. Go to: Settings → Integrations → API & Webhooks
4. Click "Generate New Token"
5. Copy the token
6. Add to Netlify as `CALENDLY_API_TOKEN`

**Note:** If you skip this step, the system will still work using direct Calendly links!

### Step 4: Deploy

1. Commit and push your code:
```bash
git add .
git commit -m "Add email and scheduling features"
git push origin main
```

2. Netlify will auto-deploy

3. Wait 2-3 minutes for deployment to complete

---

## 🧪 Testing

### Test 1: Visitor Sends You a Message

1. Go to your portfolio avatar page
2. Type: "I'd like to discuss a job opportunity"
3. AI will ask for your name and email
4. Provide test info
5. AI shows draft → Click "Send Message"
6. Check your inbox (dishasawantt@gmail.com)

### Test 2: Send Resume to Visitor

1. Type: "Can you send me your resume?"
2. AI asks for email
3. Provide: your-test-email@gmail.com
4. AI confirms → Click "Send Documents"
5. Check the test email inbox for resume

### Test 3: Schedule Meeting

1. Type: "I'd like to schedule a call"
2. AI generates Calendly link instantly
3. Click "Open Calendar"
4. Should open your Calendly page

---

## 🔍 Troubleshooting

### Email not sending?
- Check Resend API key is correct in Netlify
- Make sure you redeployed after adding env vars
- Check Netlify function logs for errors

### Calendly not working?
- If API token not set, it falls back to direct URLs (this is fine!)
- Update `CALENDLY_USER` to match your username

### "Rate limit exceeded"?
- Each visitor can send 3 emails per hour (anti-spam)
- Each visitor can request documents 3 times per day
- This is intentional for security

---

## 📊 What Gets Logged

The system logs:
- Number of emails sent
- Document requests
- Meeting scheduling requests
- IP addresses (for rate limiting only)

No sensitive data is stored permanently.

---

## 🎨 Customization

### Change Email Templates

Edit: `netlify/functions/send-email.js` and `send-document.js`

### Adjust Rate Limits

In each function file, find:
```javascript
checkRateLimit(identifier, 3, 3600000) // 3 requests per hour
```

Change the numbers:
- First number: max requests
- Second number: time window in milliseconds

### Add More Documents

Edit `netlify/functions/send-document.js`:
```javascript
const AVAILABLE_DOCUMENTS = {
    resume: { ... },
    certificate: { 
        path: 'certificate.pdf',
        name: 'Certificate.pdf',
        description: 'Certificate'
    }
};
```

---

## 🚀 Next Steps

1. ✅ Set up Resend API key in Netlify
2. ✅ Redeploy your site
3. ✅ Test all three features
4. ✅ (Optional) Add Calendly API token for better integration
5. ✅ Monitor your Netlify function logs for usage

---

## 💡 Tips

- **Test with your own email first** to see what visitors receive
- **Check spam folder** if emails don't arrive (first-time Resend emails sometimes go there)
- **Calendly works without API** - the token just makes it fancier
- **Rate limits protect you** from spam and abuse

---

## 📞 Support

If something doesn't work:
1. Check Netlify function logs: Site → Functions → View logs
2. Verify environment variables are set correctly
3. Make sure you redeployed after adding variables
4. Check browser console for frontend errors

---

## ✨ You're All Set!

Your portfolio now has a fully functional AI assistant that can:
- ✅ Receive messages from visitors
- ✅ Send your resume to interested parties
- ✅ Schedule meetings automatically

All powered by AI with natural conversation! 🎉

