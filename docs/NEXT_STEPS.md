# Next Steps - Deployment Guide

## Current Status

| Component | Status | URL |
|-----------|--------|-----|
| **Portfolio** | ✅ Live | https://dishasawantt.github.io/resume |
| **Chatbot** | ⏳ Needs Deployment | https://disha-chat.pages.dev (after deployment) |

---

## Step 1: Deploy Chatbot to Cloudflare Pages

### 1.1 Access Cloudflare Dashboard

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Sign in (or create account with GitHub/Google/Email)
3. Navigate to **Workers & Pages** in the left sidebar

### 1.2 Connect GitHub Repository

1. Click **Create** button
2. Select **Pages**
3. Click **Connect to Git**
4. Authorize Cloudflare to access your GitHub (if first time)
5. Select the **disha-chat** repository
6. Click **Begin setup**

### 1.3 Configure Build Settings

| Setting | Value |
|---------|-------|
| Project name | `disha-chat` |
| Production branch | `main` |
| Build command | *(leave empty)* |
| Build output directory | *(leave empty or `/`)* |

### 1.4 Add Environment Variables

Click **Add variable** for each:

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `GROQ_API_KEY` | `gsk_...` | Get from [console.groq.com/keys](https://console.groq.com/keys) |
| `SENDGRID_API_KEY` | `SG...` | Optional - for email resume feature |

### 1.5 Deploy

1. Click **Save and Deploy**
2. Wait 1-2 minutes for deployment
3. Your chatbot will be live at: `https://disha-chat.pages.dev`

---

## Step 2: Get API Keys (If Needed)

### Groq API Key (Required)

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up / Log in
3. Navigate to **API Keys**
4. Click **Create API Key**
5. Copy the key (starts with `gsk_`)

**Free Tier:** 14,400 requests/day, 6,000 tokens/minute

### SendGrid API Key (Optional - for Email Feature)

1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up for free account
3. Navigate to **Settings** → **API Keys**
4. Click **Create API Key**
5. Select **Full Access** or **Restricted Access** (Mail Send only)
6. Copy the key (starts with `SG.`)

**Free Tier:** 100 emails/day

---

## Step 3: Verify Everything Works

### 3.1 Test Portfolio

1. Visit https://dishasawantt.github.io/resume
2. Verify:
   - [ ] All images load correctly
   - [ ] "Chat with Me" button visible
   - [ ] Navigation works
   - [ ] Resume download works

### 3.2 Test Chatbot

1. Visit https://disha-chat.pages.dev
2. Verify:
   - [ ] Page loads with video avatar
   - [ ] Greeting video plays on first visit
   - [ ] Chat input accepts messages
   - [ ] AI responds to questions
   - [ ] Quick action buttons work
   - [ ] "Back to Portfolio" link returns to main site
   - [ ] Text-to-speech works (speaker icon)
   - [ ] Speech-to-text works (microphone icon)

### 3.3 Test Integration

1. From portfolio, click "Chat with Me"
2. Verify opens chatbot in new tab
3. From chatbot, click "Back to Portfolio"
4. Verify returns to portfolio

---

## Step 4: Custom Domain (Optional)

### For Chatbot (Cloudflare)

1. In Cloudflare dashboard, go to your **disha-chat** project
2. Click **Custom domains**
3. Add domain like `chat.yourdomain.com`
4. Follow DNS configuration steps

### For Portfolio (GitHub Pages)

1. Go to GitHub repo → **Settings** → **Pages**
2. Under **Custom domain**, enter your domain
3. Configure DNS with your registrar:
   - CNAME record: `www` → `dishasawantt.github.io`
   - A records for apex domain (if needed)

---

## Step 5: Update Environment Variables (If Needed)

### Cloudflare Pages

1. Go to Cloudflare dashboard → **Workers & Pages**
2. Click on **disha-chat**
3. Go to **Settings** → **Environment variables**
4. Edit or add variables
5. Click **Save**
6. Redeploy for changes to take effect:
   - Go to **Deployments**
   - Click **...** on latest deployment → **Retry deployment**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         USER                                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌─────────────────────┐       ┌─────────────────────┐
│   GitHub Pages      │       │  Cloudflare Pages   │
│   (Portfolio)       │       │  (Chatbot)          │
│                     │       │                     │
│  - Static HTML/CSS  │ ────► │  - Avatar UI        │
│  - Resume PDF       │       │  - Video Player     │
│  - Project Images   │       │  - Chat Interface   │
│                     │       │                     │
│  100% Uptime        │       │  - Serverless API   │
│  No Limits          │       │  - Groq Integration │
└─────────────────────┘       └──────────┬──────────┘
                                         │
                              ┌──────────┴──────────┐
                              ▼                     ▼
                    ┌─────────────────┐   ┌─────────────────┐
                    │   Groq API      │   │   SendGrid      │
                    │   (AI Chat)     │   │   (Email)       │
                    │                 │   │                 │
                    │   Free: 14.4K   │   │   Free: 100     │
                    │   requests/day  │   │   emails/day    │
                    └─────────────────┘   └─────────────────┘
```

---

## Troubleshooting

### Images Not Loading on Portfolio

**Cause:** Case sensitivity - GitHub Pages is case-sensitive  
**Fix:** Already resolved (Assets → assets)

### Chatbot Returns 500 Error

**Cause:** Missing or invalid API key  
**Fix:** 
1. Check `GROQ_API_KEY` in Cloudflare environment variables
2. Verify key is valid at console.groq.com
3. Redeploy after changes

### Chat Not Responding

**Cause:** Rate limit exceeded  
**Fix:** Wait a few minutes (Groq free tier: 30 req/min)

### Email Not Sending

**Cause:** Missing SendGrid key or sender not verified  
**Fix:**
1. Add `SENDGRID_API_KEY` to Cloudflare
2. Verify sender email in SendGrid dashboard

### CORS Errors in Console

**Cause:** API not deployed correctly  
**Fix:** Verify `functions/api/_middleware.js` exists and is deployed

---

## Maintenance

### Updating Portfolio Content

```bash
cd /Users/dishasawant/Desktop/Desktop/resume

# Make changes to index.html, styles.css, etc.

git add .
git commit -m "Update portfolio content"
git push origin main

# GitHub Pages auto-deploys in ~1 minute
```

### Updating Chatbot

```bash
cd /Users/dishasawant/Desktop/Desktop/disha-chat

# Make changes

git add .
git commit -m "Update chatbot"
git push origin main

# Cloudflare auto-deploys in ~1-2 minutes
```

### Updating Knowledge Base

Edit `/docs/KNOWLEDGE_BASE.md` in the chatbot repo to update what the AI knows about you.

---

## Cost Summary

| Service | Free Tier | Your Usage | Monthly Cost |
|---------|-----------|------------|--------------|
| GitHub Pages | Unlimited | Static hosting | **$0** |
| Cloudflare Pages | 500 builds/month | Chatbot hosting | **$0** |
| Cloudflare Functions | 100K requests/day | API calls | **$0** |
| Groq API | 14.4K requests/day | AI responses | **$0** |
| SendGrid | 100 emails/day | Resume emails | **$0** |

**Total Monthly Cost: $0** (within free tiers)

---

## Quick Reference

| What | Where |
|------|-------|
| Portfolio URL | https://dishasawantt.github.io/resume |
| Chatbot URL | https://disha-chat.pages.dev |
| Portfolio Repo | https://github.com/dishasawantt/resume |
| Chatbot Repo | https://github.com/dishasawantt/disha-chat |
| Cloudflare Dashboard | https://dash.cloudflare.com |
| Groq Console | https://console.groq.com |
| GitHub Settings | https://github.com/settings |
