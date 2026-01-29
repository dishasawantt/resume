# Cloudflare Pages Deployment Guide

This guide explains how to deploy the portfolio to Cloudflare Pages with serverless functions.

## Architecture

```
Cloudflare Pages
├── Static Files (served from root)
│   ├── index.html, styles.css, script.js
│   ├── avatar.html, avatar.css, avatar.js
│   ├── assets/, docs/
│   └── Disha Sawant Resume 2025.pdf
│
└── Functions (functions/api/)
    ├── chat.js          → /api/chat
    ├── schedule-meeting.js → /api/schedule-meeting
    ├── send-document.js → /api/send-document
    └── _middleware.js   → CORS handling
```

## Free Tier Limits

| Resource | Limit |
|----------|-------|
| Function Requests | 100,000/day (~3M/month) |
| Static Bandwidth | Unlimited |
| Build Minutes | 500/month |
| Custom Domains | Unlimited |

## Deployment Steps

### Option 1: Via Cloudflare Dashboard (Recommended)

1. **Create Cloudflare Account**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Sign up for free

2. **Create Pages Project**
   - Click **Workers & Pages** → **Create**
   - Select **Pages** → **Connect to Git**
   - Authorize GitHub and select your repository

3. **Configure Build Settings**
   - **Framework preset**: None
   - **Build command**: (leave empty)
   - **Build output directory**: `.` (or leave empty)
   - **Root directory**: `/` (default)

4. **Set Environment Variables**
   Go to **Settings** → **Environment variables** and add:
   
   | Variable | Value | Type |
   |----------|-------|------|
   | `GROQ_API_KEY` | your-groq-api-key | Secret |
   | `SENDGRID_API_KEY` | your-sendgrid-api-key | Secret |
   | `SITE_URL` | https://your-project.pages.dev | Plain text |

5. **Deploy**
   - Click **Save and Deploy**
   - Wait for build to complete
   - Your site is live at `https://your-project.pages.dev`

### Option 2: Via CLI (wrangler)

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   # or
   npm install
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Create Project (first time only)**
   ```bash
   wrangler pages project create disha-portfolio
   ```

4. **Set Secrets**
   ```bash
   wrangler pages secret put GROQ_API_KEY
   wrangler pages secret put SENDGRID_API_KEY
   ```

5. **Deploy**
   ```bash
   npm run deploy
   # or
   wrangler pages deploy .
   ```

## Local Development

```bash
# Install dependencies
npm install

# Start local dev server with functions
npm run dev

# Site available at http://localhost:8788
```

## Custom Domain Setup

1. Go to your Pages project → **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `portfolio.dishasawant.com`)
4. Follow DNS configuration instructions
5. SSL certificate is automatically provisioned

## Troubleshooting

### Functions not working?

1. Check that `functions/api/` folder exists with `.js` files
2. Verify environment variables are set in dashboard
3. Check function logs in **Workers & Pages** → Your project → **Functions** → **Logs**

### CORS errors?

The `_middleware.js` handles CORS. If issues persist, check browser console for specific errors.

### Build failing?

- Ensure no build command is set (static site)
- Check that all files are committed to git
- Verify `package.json` is valid

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq API key for LLaMA chat |
| `SENDGRID_API_KEY` | Optional | SendGrid for email functionality |
| `SITE_URL` | Optional | Your deployed URL (for internal API calls) |

## Migration from Netlify

This project was migrated from Netlify. Key differences:

| Netlify | Cloudflare |
|---------|------------|
| `netlify/functions/*.js` | `functions/api/*.js` |
| `exports.handler` | `export async function onRequest` |
| `event.body` (string) | `await request.json()` |
| 125k functions/month | 100k functions/day |
| `netlify.toml` | `wrangler.toml` |

## Useful Commands

```bash
# Deploy to production
npm run deploy

# Deploy to preview branch
npm run deploy:preview

# Local development
npm run dev

# Check Wrangler version
wrangler --version

# View deployment logs
wrangler pages deployment tail
```

## Support

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Pages Functions Docs](https://developers.cloudflare.com/pages/functions/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
