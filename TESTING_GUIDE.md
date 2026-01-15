# 🧪 Testing Guide for AI Email & Scheduling Features

## Quick Test Scenarios

### Scenario 1: Visitor Wants to Contact You

**User Message:** "I'm interested in hiring you for an ML role at Google"

**Expected Flow:**
1. AI responds: "That sounds exciting! What's your name and email so I can get back to you?"
2. User provides: "John Smith, john@google.com"
3. AI drafts email showing preview
4. Approval buttons appear: [Send Message] [Cancel]
5. User clicks "Send Message"
6. AI confirms: "Perfect! Your message has been sent..."
7. Check dishasawantt@gmail.com inbox for email from Portfolio Assistant

**What to Check:**
- ✅ Email arrives in your inbox
- ✅ From: Portfolio Assistant <onboarding@resend.dev>
- ✅ Reply-To: john@google.com
- ✅ Subject: "Portfolio Inquiry from John Smith"
- ✅ Body includes visitor's message and context
- ✅ When you hit reply, it goes to john@google.com

---

### Scenario 2: Visitor Requests Resume

**User Message:** "Can you send me your resume?"

**Expected Flow:**
1. AI responds: "I'd be happy to send you my resume! What email should I send it to?"
2. User provides: "sarah@tesla.com"
3. AI confirms: "Great! I'll send my resume to sarah@tesla.com. Should I proceed?"
4. Approval buttons: [Send Documents] [Cancel]
5. User clicks "Send Documents"
6. AI confirms: "Done! I've sent my resume to sarah@tesla.com..."
7. Check sarah@tesla.com inbox

**What to Check:**
- ✅ Email arrives at provided address
- ✅ From: Disha Sawant <onboarding@resend.dev>
- ✅ Subject: "Disha Sawant - Resume"
- ✅ PDF attachment: Disha_Sawant_Resume_2025.pdf
- ✅ Professional email body with about section
- ✅ Calendly link included
- ✅ Contact links (portfolio, LinkedIn) included

---

### Scenario 3: Schedule Meeting

**User Message:** "I'd like to schedule a meeting to discuss your experience"

**Expected Flow:**
1. AI responds: "I'll generate a scheduling link for a 30-minute consultation. One moment!"
2. Approval button: [Get Link]
3. User clicks "Get Link"
4. Calendly card appears with:
   - Meeting type name
   - Duration
   - [Open Calendar] button
   - [Copy Link] button
5. User clicks "Open Calendar"
6. Calendly page opens in new tab

**What to Check:**
- ✅ Calendly card displays properly
- ✅ Correct meeting duration shown
- ✅ Link opens Calendly in new tab
- ✅ Copy button works (copies link to clipboard)
- ✅ Shows confirmation "Copied!" when clicked

---

## Edge Case Testing

### Test 4: Rate Limiting

**Test Contact Email Rate Limit:**
1. Send 3 contact messages in quick succession
2. Try a 4th message
3. Should show: "Rate limit exceeded. Please try again in X minutes."

**Test Document Rate Limit:**
1. Request resume 3 times to same email
2. Try 4th request
3. Should show rate limit message

---

### Test 5: Invalid Email

**User Message:** "Send resume to notanemail"

**Expected:**
- AI should handle gracefully
- Error message: "Invalid email address"

---

### Test 6: Cancel Action

**Test Flow:**
1. Start any action (contact, document, schedule)
2. When approval buttons appear, click [Cancel]
3. AI should respond: "No problem! Let me know if you need anything else."
4. No email sent, no action taken

---

### Test 7: Multiple Meeting Types

**Quick Chat (15 min):**
- User: "Can we have a quick 15-minute call?"
- AI generates 15-min meeting link

**Consultation (30 min):**
- User: "I'd like to discuss my project with you"
- AI generates 30-min consultation

**Interview (45 min):**
- User: "Can we schedule a job interview?"
- AI generates 45-min interview

---

## Integration Testing

### Test 8: Full Conversation Flow

**Complete Scenario:**
```
User: "Hi, I'm a recruiter from Microsoft"
AI: [greeting]

User: "We have an ML engineering position. Can you send me your resume?"
AI: "I'd be happy to send you my resume! What email should I send it to?"

User: "recruiter@microsoft.com"
AI: [Shows draft, approval buttons]

User: [Clicks Send Documents]
AI: [Confirms sent]

User: "Great! Can we schedule an interview?"
AI: [Generates interview scheduling link]

User: [Clicks Get Link]
AI: [Shows Calendly card for 45-min interview]
```

**What to Check:**
- ✅ Conversation flows naturally
- ✅ AI maintains context throughout
- ✅ All actions execute correctly
- ✅ UI elements appear properly
- ✅ No JavaScript errors in console

---

## Testing Without Environment Variables

### Fallback Behavior

If env variables are missing:

**Without RESEND_API_KEY:**
- Contact email: Shows error, suggests direct email
- Document sending: Shows error, suggests download button

**Without CALENDLY_API_TOKEN:**
- Still works! Uses fallback URLs
- Links to: https://calendly.com/dishasawantt

---

## Browser Testing

Test in multiple browsers:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Mobile Safari (iOS)
- ✅ Mobile Chrome (Android)

---

## Mobile Testing

### Test 9: Mobile Experience

**On Mobile Device:**
1. Approval buttons should stack vertically
2. Scheduling card should be responsive
3. Email collection should work with mobile keyboard
4. Links should open in new tabs properly

---

## Performance Testing

### Test 10: Response Times

**Expected Response Times:**
- Contact email: 1-2 seconds
- Document sending: 2-3 seconds (includes PDF attachment)
- Scheduling link: 0.5-1 second

If slower, check:
- Netlify function cold starts
- Network connection
- File size of attachments

---

## Error Handling Testing

### Test 11: Network Errors

**Simulate by:**
1. Going offline
2. Trying to send message
3. AI should show friendly error: "I am having trouble connecting..."

### Test 12: API Errors

**If Resend/Calendly API is down:**
- Should show graceful error
- Should suggest alternatives (direct email, direct Calendly link)
- Should not crash the chat

---

## Security Testing

### Test 13: Spam Prevention

**Rate Limits:**
- Contact: 3 per hour per IP
- Documents: 3 per day per email
- No limit on scheduling (just generates links)

**Email Validation:**
- Rejects invalid email formats
- Accepts standard emails
- Accepts emails with + signs (e.g., test+portfolio@gmail.com)

---

## Production Checklist

Before going live:

- [ ] RESEND_API_KEY set in Netlify
- [ ] GROQ_API_KEY set in Netlify (already done)
- [ ] CALENDLY_USER matches your username
- [ ] Resume PDF file exists in root directory
- [ ] Test all 3 features with real email addresses
- [ ] Check spam folder for Resend emails
- [ ] Verify reply-to works correctly
- [ ] Test on mobile device
- [ ] Check Netlify function logs for errors
- [ ] Verify no console errors in browser

---

## Monitoring

### After Launch, Monitor:

**Netlify Functions Dashboard:**
- Function invocations count
- Error rate
- Average execution time

**Email Delivery:**
- Check Resend dashboard for delivery stats
- Monitor bounce rate
- Check spam reports

**User Behavior:**
- Which feature is used most?
- Conversion rate (visitors → contact/schedule)
- Average time to complete action

---

## Common Issues & Solutions

### Issue: Email not received
**Solution:**
1. Check spam folder
2. Verify RESEND_API_KEY is correct
3. Check Netlify function logs
4. Verify email address is valid

### Issue: Calendly link doesn't work
**Solution:**
1. Check CALENDLY_USER is correct
2. Falls back to general link if API fails (this is fine)
3. Verify Calendly account is active

### Issue: Approval buttons not appearing
**Solution:**
1. Check browser console for JS errors
2. Verify avatar.js loaded correctly
3. Clear browser cache

### Issue: "Rate limit exceeded" too quickly
**Solution:**
1. Adjust rate limits in function files
2. Or wait for time window to reset

---

## Success Metrics

### Good Performance Indicators:
- ✅ <2 second response time for email actions
- ✅ 0% error rate in Netlify functions
- ✅ >90% email delivery rate (Resend dashboard)
- ✅ No JavaScript errors in browser console
- ✅ Mobile responsive on all devices

---

## Testing Completed Checklist

- [ ] Scenario 1: Visitor contact ✓
- [ ] Scenario 2: Send resume ✓
- [ ] Scenario 3: Schedule meeting ✓
- [ ] Test 4: Rate limiting ✓
- [ ] Test 5: Invalid email ✓
- [ ] Test 6: Cancel action ✓
- [ ] Test 7: Multiple meeting types ✓
- [ ] Test 8: Full conversation flow ✓
- [ ] Test 9: Mobile experience ✓
- [ ] Test 10: Response times ✓
- [ ] Test 11: Network errors ✓
- [ ] Test 12: API errors ✓
- [ ] Test 13: Security/spam prevention ✓

---

**All tests passing? You're ready to go live! 🚀**

