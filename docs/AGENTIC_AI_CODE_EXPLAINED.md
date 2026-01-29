# Agentic AI Code Documentation

This document explains the agentic AI components of the portfolio chatbot. The system allows an AI to take actions on behalf of users, such as sending emails and scheduling meetings, through a conversational interface.

---

# File 1: `chat.js` — The AI Brain

## Purpose

This is the core serverless function that powers the conversational AI. It receives user messages, processes them through Groq's Llama 3.3 70B model, and determines whether to respond with text or invoke tools like sending documents or scheduling meetings. It also searches LinkedIn connections when users ask about specific people.

---

## Chunk 1: Dependencies and Background Data

```javascript
const Groq = require("groq-sdk");
const connections = require("./connections.json");
const { headers, isValidEmail, log, logError, errorResponse, successResponse, checkMethod } = require('./utils');

const MY_BACKGROUND = {
    schools: ["SDSU", "San Diego State University", "University of Mumbai"],
    companies: ["Ema Unlimited", "Image Computers", "Saint Louis University", "GreatAlbum", "PlotMyData", "Beat The Virus"]
};

const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
```

This section imports the Groq SDK which is the client library for calling the Llama model. It also loads a large JSON file containing over 15,000 LinkedIn connections. The utility functions handle common tasks like formatting responses and validating emails. The MY_BACKGROUND object stores the schools I attended and companies I worked at, which helps identify mutual connections when someone asks about a person. The normalize function strips out special characters and converts text to lowercase so we can compare names consistently.

---

## Chunk 2: LinkedIn Connection Search

```javascript
function searchConnections(query) {
    const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
    const queryJoined = terms.join(' ');
    
    return connections
        .map(c => {
            const name = c.name.toLowerCase();
            const nameParts = name.split(' ');
            let score = 0;
            
            if (name === queryJoined) score = 100;
            else if (terms.every(t => name.includes(t))) score = 50;
            else if (terms.length >= 2 && nameParts[0]?.startsWith(terms[0]) && nameParts.at(-1)?.startsWith(terms.at(-1))) score = 40;
            else if (terms.some(t => nameParts.some(n => n.startsWith(t)))) score = 10;
            else if (terms.some(t => name.includes(t))) score = 5;
            
            return score > 0 ? { c, score } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(r => r.c);
}
```

This function takes a name query and searches through all LinkedIn connections to find matches. It splits the query into individual terms and then scores each connection based on how well their name matches. An exact match gets 100 points, while a partial match where all terms appear somewhere in the name gets 50 points. If someone searches with a first and last name and both match the beginning of the connection's first and last names, that gets 40 points. Lower scores are assigned for partial matches. The function returns only the top 3 results sorted by relevance.

---

## Chunk 3: Formatting Connections and Showing Relationships

```javascript
function formatConnection(c) {
    const relations = [];
    const checkMatch = (items, field, list) => items?.forEach(item => {
        const normalized = normalize(item[field]);
        if (list.some(n => normalized.includes(normalize(n)))) relations.push(`${field === 'school' ? 'Alumni from' : 'Colleague at'} ${item[field]}`);
    });
    
    checkMatch(c.education, 'school', MY_BACKGROUND.schools);
    checkMatch(c.experience, 'company', MY_BACKGROUND.companies);
    
    return `${c.name}: ${c.title} at ${c.company}${relations.length ? ` [${relations[0]}]` : ''}`;
}
```

Once we find matching connections, this function formats them nicely for display. It checks whether I share any educational background with the connection by comparing their schools against my schools. It does the same for work experience. If we attended the same university, it notes that we are alumni. If we worked at the same company, it notes that we were colleagues. The final output includes the person's name, their current title and company, and any relationship we share.

---

## Chunk 4: Extracting Names from Natural Language

```javascript
function extractNameQuery(msg) {
    if (/mail|send|email|resume|cv|schedule|meeting|call|interview|book/i.test(msg)) return null;
    
    const patterns = [
        /do you know (\w+(?:\s+\w+){0,2})/i, /know (\w+(?:\s+\w+){0,2})\??/i,
        /who(?:'?s| is) (\w+(?:\s+\w+){0,2})/i, /tell me about (\w+(?:\s+\w+){0,2})/i,
        /connected (?:to|with) (\w+(?:\s+\w+){0,2})/i, /find (\w+(?:\s+\w+){0,2})/i,
        /search (?:for )?(\w+(?:\s+\w+){0,2})/i, /look(?:ing)? (?:up|for) (\w+(?:\s+\w+){0,2})/i,
        /^(\w+(?:\s+\w+){0,2})\??$/i
    ];
    
    const blacklist = /^(you|your|me|my|the|this|that|what|how|why|when|where|can|could|would|should|i|a|an|yes|no|ok|hi|hello|hey|sure|thanks|thank|please|help|she|he|they|her|him|them|it|is|are|was|were)$/i;
    
    for (const p of patterns) {
        const m = msg.match(p);
        if (m?.[1]?.length > 2 && !blacklist.test(m[1].trim())) return m[1].trim();
    }
    return null;
}
```

This function analyzes user messages to determine if they are asking about a specific person. First, it checks if the message is about sending emails or scheduling, and if so, it returns null because those are tool requests, not connection searches. Then it tries several patterns like "do you know John Smith" or "who is Sarah" to extract the name. There is a blacklist of common words that should not be treated as names, such as pronouns and greetings. If a valid name is found, it returns that name. Otherwise, it returns null.

---

## Chunk 5: Tool Definitions for Function Calling

```javascript
const TOOLS = [{
    type: "function",
    function: {
        name: "send_documents",
        description: "Send resume to visitor. ONLY when user explicitly says 'mail/send/email me resume'. MUST have real name AND email first.",
        parameters: {
            type: "object",
            properties: {
                recipientName: { type: "string", description: "Recipient's actual name" },
                recipientEmail: { type: "string", description: "Recipient's actual email" },
                documents: { type: "array", items: { type: "string", enum: ["resume"] } }
            },
            required: ["recipientName", "recipientEmail", "documents"]
        }
    }
}, {
    type: "function", 
    function: {
        name: "schedule_meeting",
        description: "Generate scheduling link. ONLY when user explicitly asks to schedule/book a meeting/call.",
        parameters: {
            type: "object",
            properties: { meetingType: { type: "string", enum: ["quick_chat", "consultation", "interview"] } },
            required: ["meetingType"]
        }
    }
}];
```

This defines the two tools that the AI can invoke. The first tool is send_documents, which requires the recipient's name, email, and which documents to send. The description tells the AI to only use this when someone explicitly asks to receive the resume and already provided their contact information. The second tool is schedule_meeting, which generates a Calendly link for a quick chat, consultation, or interview. These definitions follow the OpenAI function calling format that Groq also supports.

---

## Chunk 6: System Prompt — The AI's Personality

```javascript
const SYSTEM_PROMPT = `You ARE Disha Sawant on your portfolio chatbot. Warm, concise (2-3 sentences), no emojis.

CONTACT: dishasawantt@gmail.com | 619-918-7729 | linkedin.com/in/disha-sawant-7877b21b6
LINKS: #projects #experience #education #skills #certifications

BACKGROUND: MS CompE SDSU (2024-26, 3.5) | BS Mumbai (2018-22, 3.7)
Ema AI Intern: Claims 90%, Zendesk 82% automation | Image Computers: ETL 500K+
22 certs (DeepLearning.AI, UCSD Big Data, IBM) | 72 courses
PROJECTS: Brain Tumor (98%), Emotion AI (87%), Credit Default (82%), MathUI, VoiceUI
SKILLS: Python, JS, TensorFlow, PyTorch, React, FastAPI, AWS, Docker

LINKEDIN: When [LINKEDIN] data is provided, USE IT to answer about people. Never ignore it.

TOOLS:
- send_documents: ONLY with real name + valid email. Ask if missing.
- schedule_meeting: ONLY when user explicitly asks to schedule/book.
- Never use tools for connection questions, contact info, or general questions.

RULES: First person only. Never show JSON/technical details. Never invent info.`;
```

This system prompt defines everything the AI needs to know to behave correctly. It tells the AI to speak as Disha Sawant in first person with a warm but concise tone. The prompt includes key facts about education, work experience, certifications, and projects so the AI can answer questions accurately. It instructs the AI to use LinkedIn data when provided and explains when to use each tool. The rules section prevents the AI from revealing technical details or making up information.

---

## Chunk 7: Parameter Validation

```javascript
const PLACEHOLDER = /^(user|visitor|name|email|your|their|unknown|placeholder|recipient|test|sample|dummy|your name|the user|n\/a)$/i;

function validateToolParams(fn, args) {
    if (fn !== 'send_documents') return { valid: true };
    const { recipientName: name, recipientEmail: email } = args;
    
    if (!name || name.length < 2 || PLACEHOLDER.test(name.trim()) || /disha|sawant|your name|user's|user name|their name/i.test(name) || name.includes('@'))
        return { valid: false, message: "I'd be happy to send my resume! What's your name?" };
    if (!email?.includes('@') || !isValidEmail(email))
        return { valid: false, message: `Thanks ${name}! What's your email address?` };
    return { valid: true };
}
```

When the AI decides to call send_documents, this function validates the parameters before executing. The PLACEHOLDER regex catches common placeholder values that the AI might incorrectly use, such as "user" or "your name" or "placeholder". The validation checks that the name is real by ensuring it is at least 2 characters, not a placeholder, not my own name, and not an email address. It also validates that the email contains an @ symbol and passes the email format check. If validation fails, it returns a friendly message asking for the missing information.

---

## Chunk 8: Response Sanitization and Tool Execution

```javascript
function sanitizeResponse(text) {
    return text?.replace(/function=\w+>[\s\S]*?(?:<\/function>|\})/g, '').replace(/\{"[^"]+":[\s\S]*?\}/g, '').trim() || null;
}

async function executeTool({ function: fn, arguments: args }) {
    const baseUrl = process.env.URL || 'http://localhost:8888';
    const endpoints = { send_documents: 'send-document', schedule_meeting: 'schedule-meeting' };
    
    try {
        const res = await fetch(`${baseUrl}/.netlify/functions/${endpoints[fn]}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(args)
        });
        const result = await res.json();
        
        if (fn === 'send_documents') {
            return result.success 
                ? { success: true, response: `Done! I've sent my resume to ${args.recipientEmail}. Check spam if needed!` }
                : { success: false, response: "Trouble sending. Download from the main page instead." };
        }
        return result.success
            ? { success: true, response: `Here's the scheduling link!`, ...result }
            : { success: false, response: "Trouble generating link. Visit calendly.com/dishasawantt directly." };
    } catch (e) {
        logError('Tool error:', e.message);
        return { success: false, response: "Error occurred. Please try again or email dishasawantt@gmail.com" };
    }
}
```

The sanitizeResponse function removes any JSON or function call syntax that might leak into the AI's response, keeping the output clean and natural. The executeTool function handles actually calling the other serverless functions. It constructs the URL based on the environment, maps the tool name to the correct endpoint, and makes a POST request with the arguments. Based on whether the operation succeeded, it returns a human-friendly message. If anything fails, it provides a helpful fallback message.

---

## Chunk 9: Main Handler — Orchestrating Everything

```javascript
exports.handler = async (event) => {
    const methodCheck = checkMethod(event.httpMethod);
    if (methodCheck) return methodCheck;

    try {
        const { message, history = [], toolExecutionData } = JSON.parse(event.body);
        
        if (toolExecutionData) return successResponse(await executeTool(toolExecutionData));
        if (!message || typeof message !== 'string') return errorResponse(400, "Message required");

        const lastAssistant = history.slice().reverse().find(m => m.role === 'assistant');
        const isCollectingData = lastAssistant && /what's your (name|email)|provide.*email|your name\?/i.test(lastAssistant.content || '');
        
        let connectionContext = "", isConnectionQuery = false;
        if (!isCollectingData) {
            const nameQuery = extractNameQuery(message);
            if (nameQuery) {
                isConnectionQuery = true;
                const matches = searchConnections(nameQuery);
                connectionContext = matches.length 
                    ? `\n\n[LINKEDIN] Found: ${matches.map(formatConnection).join('; ')}`
                    : `\n\n[LINKEDIN] No connection named "${nameQuery}" found.`;
            }
        }
```

This is the entry point for all chat requests. First it checks if this is a preflight OPTIONS request or non-POST method. Then it parses the request body to get the user's message, conversation history, and any pending tool execution data. If tool execution data is provided, that means the user approved a tool call and we should execute it immediately. Otherwise, we check if the AI was in the middle of collecting the user's name or email. If not, we check if the message is asking about a LinkedIn connection. If we find connection matches, we add that context to the system prompt so the AI can use it.

---

## Chunk 10: Calling the AI Model

```javascript
        const cleanHistory = history.slice(-4).filter(msg => {
            if (msg.role !== 'assistant') return true;
            const c = msg.content?.toLowerCase() || '';
            if (/what's your|what is your/i.test(c)) return true;
            return !/(scheduling link|i'll send|i've sent|should i proceed)/i.test(c);
        });

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: SYSTEM_PROMPT + connectionContext }, ...cleanHistory, { role: "user", content: message }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 250,
            top_p: 0.9,
            tools: isConnectionQuery ? undefined : TOOLS,
            tool_choice: isConnectionQuery ? undefined : "auto"
        });
```

Before calling the AI, we clean up the conversation history. We keep only the last 4 messages to stay within context limits. We filter out assistant messages about tool execution since those might confuse the AI. Then we initialize the Groq client and make the chat completion request. The system prompt includes any LinkedIn connection context we found earlier. We use Llama 3.3 70B with a temperature of 0.7 for natural but focused responses. If this is a connection query, we disable tools since they are not relevant.

---

## Chunk 11: Handling Tool Calls and Responses

```javascript
        const resp = completion.choices[0]?.message;
        
        if (resp.tool_calls?.length) {
            const { name: fn, arguments: argsStr } = resp.tool_calls[0].function;
            const args = JSON.parse(argsStr);
            const validation = validateToolParams(fn, args);
            
            if (!validation.valid) return successResponse({ response: validation.message });
            
            const preview = fn === 'schedule_meeting' 
                ? `I'll generate a scheduling link. One moment!`
                : `I'll send my resume to ${args.recipientEmail}. Proceed?`;
            
            return successResponse({
                response: sanitizeResponse(resp.content) || preview,
                toolCall: { function: fn, arguments: args, requiresApproval: true }
            });
        }

        return successResponse({ response: sanitizeResponse(resp.content) || "Could you rephrase that?" });

    } catch (error) {
        logError("API Error:", error.message);
        return error.status === 429 
            ? errorResponse(429, "Rate limit. Please wait.")
            : errorResponse(500, "Request failed. Try again.");
    }
};
```

After receiving the AI's response, we check if it wants to call a tool. If so, we extract the function name and arguments, then validate them. If validation fails, we return the validation message asking for missing information. If validation passes, we send back a preview message along with the tool call data marked as requiring approval. The frontend will show this to the user and wait for confirmation before executing. If there are no tool calls, we simply return the AI's text response. Any errors are caught and return appropriate error messages.

---

# File 2: `send-document.js` — The Email Tool

## Purpose

This serverless function handles sending Disha's resume to interested parties via email. It uses SendGrid to compose and send a professional email with the PDF resume attached.

---

## Chunk 1: Setup and Document Definition

```javascript
const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');
const { checkRateLimit, isValidEmail, log, logError, errorResponse, successResponse, checkMethod } = require('./utils');

const DOCUMENTS = {
    resume: { path: 'Disha Sawant Resume 2025.pdf', name: 'Disha_Sawant_Resume_2025.pdf', description: 'Resume' }
};
```

We import the SendGrid mail library for sending emails, plus Node's filesystem and path modules for reading the PDF file. The shared utilities provide rate limiting and validation. The DOCUMENTS object defines available documents with their file paths and friendly names. Currently, only the resume is available, but this structure makes it easy to add more documents later.

---

## Chunk 2: Request Handling and Validation

```javascript
exports.handler = async (event) => {
    const methodCheck = checkMethod(event.httpMethod);
    if (methodCheck) return methodCheck;

    try {
        const { recipientEmail, recipientName, documents, context } = JSON.parse(event.body);

        if (!recipientEmail || !recipientName || !Array.isArray(documents)) {
            return errorResponse(400, "Missing required fields");
        }
        if (!isValidEmail(recipientEmail)) return errorResponse(400, "Invalid email");

        const rateLimit = checkRateLimit(`doc:${recipientEmail}`, 3, 86400000);
        if (!rateLimit.allowed) return errorResponse(429, `Rate limit. Try in ${rateLimit.retryAfter} min.`);
```

The handler starts by checking the HTTP method. Then it parses the request body expecting the recipient's email, name, which documents to send, and optional context. We validate that all required fields are present and that the email format is valid. Rate limiting prevents abuse by allowing only 3 emails per email address per day. The window is 86400000 milliseconds, which equals 24 hours.

---

## Chunk 3: Reading and Attaching Documents

```javascript
        const attachments = [], documentList = [];
        for (const key of documents) {
            const doc = DOCUMENTS[key];
            if (doc) {
                try {
                    const filePath = path.join(process.cwd(), doc.path);
                    attachments.push({ 
                        filename: doc.name, 
                        content: fs.readFileSync(filePath).toString('base64'),
                        type: 'application/pdf',
                        disposition: 'attachment'
                    });
                    documentList.push(doc.description);
                } catch (e) { logError(`File read error ${doc.path}:`, e.message); }
            }
        }

        if (!attachments.length) return errorResponse(400, "No valid documents");
```

This section loops through the requested document keys and builds the attachments array. For each valid document, it reads the PDF file from the filesystem, converts it to base64 encoding which is required for email attachments, and adds it with the proper MIME type. The documentList keeps track of human-readable document names for the email body. If no valid documents are found, it returns an error.

---

## Chunk 4: Composing and Sending the Email

```javascript
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        const html = `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                <h2 style="color:#d48466">Hi ${recipientName},</h2>
                <p style="line-height:1.6;color:#333">Thanks for your interest! I'm sharing my ${documentList.join(' and ')} with you.</p>
                ${context ? `<p style="line-height:1.6;color:#333">${context}</p>` : ''}
                <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0">
                    <h3 style="color:#d48466;margin-top:0">About Me</h3>
                    <ul style="line-height:1.8;color:#333">
                        <li>MS in Computer Engineering at SDSU (AI focus)</li>
                        <li>Recent AI Engineering Intern at Ema Unlimited</li>
                        <li>Strong background in ML, agentic AI, and full-stack development</li>
                    </ul>
                </div>
                <p style="line-height:1.6;color:#333">Feel free to reach out or schedule a call.</p>
                <div style="margin:30px 0">
                    <a href="https://calendly.com/dishasawantt" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#d48466,#f7ce68);color:white;text-decoration:none;border-radius:8px;font-weight:600">📅 Schedule a Call</a>
                </div>
                <hr style="margin:30px 0;border:none;border-top:1px solid #eee">
                <p style="margin:5px 0"><strong>Best regards,</strong><br>Disha Sawant</p>
                <p style="font-size:14px;color:#666">📧 dishasawantt@gmail.com | 🔗 <a href="https://dishasawantt.github.io/resume" style="color:#d48466">Portfolio</a> | 💼 <a href="https://linkedin.com/in/disha-sawant-7877b21b6" style="color:#d48466">LinkedIn</a></p>
            </div>
        `;
```

The email is composed as a professionally styled HTML template. It greets the recipient by name and thanks them for their interest. If additional context was provided from the conversation, it includes that. A highlighted section summarizes key qualifications. There is a prominent call-to-action button linking to Calendly for scheduling. The footer includes contact information and links to the portfolio and LinkedIn.

---

## Chunk 5: Sending and Response

```javascript
        const text = `Hi ${recipientName},\n\nThanks for your interest! I'm sharing my ${documentList.join(' and ')} with you.\n\nAbout Me:\n- MS in Computer Engineering at SDSU (AI focus)\n- Recent AI Engineering Intern at Ema Unlimited\n- Strong background in ML, agentic AI, and full-stack development\n\nBest regards,\nDisha Sawant\ndishasawantt@gmail.com`;

        const result = await sgMail.send({
            to: recipientEmail,
            from: { email: 'dishasawantt@gmail.com', name: 'Disha Sawant' },
            subject: `Disha Sawant - ${documentList.join(' & ')}`,
            text, html, attachments
        });

        return successResponse({ 
            success: true, 
            messageId: result[0]?.headers?.['x-message-id'],
            documentsSent: documentList
        });

    } catch (error) {
        logError("Send error:", error.message);
        return errorResponse(500, "Failed to send");
    }
};
```

A plain text version of the email is created for clients that do not support HTML. The SendGrid send function is called with the recipient, sender information, subject line, both HTML and text bodies, and the attachments. On success, we return the message ID and list of documents sent. Any errors are logged and return a 500 error.

---

# File 3: `schedule-meeting.js` — The Calendar Tool

## Purpose

This function generates Calendly scheduling links based on the type of meeting requested. It can optionally integrate with the Calendly API to fetch live event types, or fall back to predefined links.

---

## Chunk 1: Configuration

```javascript
const { log, logError, errorResponse, successResponse, checkMethod } = require('./utils');

const CALENDLY = {
    urls: {
        quick_chat: "https://calendly.com/dishasawantt/15-minute-meeting",
        consultation: "https://calendly.com/dishasawantt/30min",
        interview: "https://calendly.com/dishasawantt/45-minute-meeting"
    },
    types: {
        quick_chat: { name: '15-Minute Call', duration: 15 },
        consultation: { name: '30-Minute Consultation', duration: 30 },
        interview: { name: '45-Minute Interview', duration: 45 }
    }
};
```

The CALENDLY configuration object contains fallback URLs for three meeting types along with their display names and durations. A quick chat is 15 minutes, a consultation is 30 minutes, and an interview is 45 minutes. These static URLs work even without API access.

---

## Chunk 2: Handler with Optional API Integration

```javascript
exports.handler = async (event) => {
    const methodCheck = checkMethod(event.httpMethod);
    if (methodCheck) return methodCheck;

    try {
        const { meetingType = 'consultation' } = JSON.parse(event.body);
        const type = CALENDLY.types[meetingType] || CALENDLY.types.consultation;
        const url = CALENDLY.urls[meetingType] || CALENDLY.urls.consultation;

        if (!process.env.CALENDLY_API_TOKEN || !process.env.CALENDLY_USER) {
            return successResponse({ success: true, schedulingUrl: url, eventName: type.name, duration: type.duration });
        }
```

The handler parses the meeting type from the request, defaulting to consultation if not specified. It looks up the corresponding type info and URL from the config. If the Calendly API credentials are not set, it immediately returns the static URL. This makes the feature work even without API setup.

---

## Chunk 3: Calendly API Integration

```javascript
        try {
            const headers = { Authorization: `Bearer ${process.env.CALENDLY_API_TOKEN}`, 'Content-Type': 'application/json' };
            
            const userRes = await fetch('https://api.calendly.com/users/me', { headers });
            if (!userRes.ok) throw new Error('User fetch failed');
            const userData = await userRes.json();

            const eventsRes = await fetch(`https://api.calendly.com/event_types?user=${userData.resource.uri}`, { headers });
            if (!eventsRes.ok) throw new Error('Events fetch failed');
            const { collection } = await eventsRes.json();

            const terms = { interview: ['interview', '45'], quick_chat: ['15', 'quick'], consultation: ['30', 'consultation'] }[meetingType] || ['30'];
            const event = collection.find(e => terms.some(t => e.name.toLowerCase().includes(t)) || e.duration === type.duration) || collection[0];

            if (event) {
                return successResponse({ success: true, schedulingUrl: event.scheduling_url, eventName: event.name, duration: event.duration });
            }
        } catch (e) { logError("Calendly API:", e.message); }

        return successResponse({ success: true, schedulingUrl: url, eventName: type.name, duration: type.duration });

    } catch (error) {
        logError("Schedule error:", error.message);
        return errorResponse(500, "Failed to generate link");
    }
};
```

When API credentials are available, we first fetch the current user's information to get their URI. Then we fetch all their event types. We search for an event that matches the requested type by looking for keywords like "interview" or duration matches. If found, we return the live scheduling URL from Calendly. If any API call fails, we log the error and fall back to the static URL. This graceful degradation ensures the feature always works.

---

# File 4: `utils.js` — Shared Utilities

## Purpose

This module provides common functionality used across all serverless functions, including CORS headers, rate limiting, email validation, and standardized response formatting.

---

## Complete File Explained

```javascript
const DEBUG = process.env.DEBUG === 'true';

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
};
```

The DEBUG flag enables verbose logging when set to true in environment variables. The headers object defines CORS settings that allow any origin to call these functions. This is necessary because the frontend runs on a different origin than the API endpoints.

```javascript
const rateLimitMap = new Map();

function checkRateLimit(id, max = 3, windowMs = 3600000) {
    const now = Date.now();
    const recent = (rateLimitMap.get(id) || []).filter(t => now - t < windowMs);
    if (recent.length >= max) return { allowed: false, retryAfter: Math.ceil((windowMs - (now - recent[0])) / 60000) };
    recent.push(now);
    rateLimitMap.set(id, recent);
    return { allowed: true };
}
```

The rate limiter uses an in-memory Map to track request timestamps per identifier. When checking a rate limit, it filters out timestamps older than the window and counts recent requests. If the limit is exceeded, it calculates when the oldest request will expire and returns how many minutes to wait. Otherwise, it records the new request and allows it. The default is 3 requests per hour.

```javascript
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = email => EMAIL_REGEX.test(email);
const log = (...args) => DEBUG && console.log(...args);
const logError = (...args) => console.error(...args);
```

The email regex validates basic email format by checking for characters before and after an @ symbol, with a dot in the domain. The log function only outputs when debugging is enabled, while logError always outputs to help diagnose production issues.

```javascript
const errorResponse = (statusCode, error) => ({ statusCode, headers, body: JSON.stringify({ error }) });
const successResponse = data => ({ statusCode: 200, headers, body: JSON.stringify(data) });

function checkMethod(method) {
    if (method === 'OPTIONS') return { statusCode: 200, headers, body: "" };
    if (method !== 'POST') return errorResponse(405, 'Method not allowed');
    return null;
}

module.exports = { headers, checkRateLimit, isValidEmail, log, logError, errorResponse, successResponse, checkMethod, EMAIL_REGEX };
```

The response helpers create properly formatted Netlify function responses with the right headers. The checkMethod function handles CORS preflight OPTIONS requests and rejects non-POST methods. All utilities are exported for use in other functions.

---

# File 5: `avatar.js` — Frontend AI Interface (Relevant Sections)

## Purpose

This is the frontend JavaScript that connects to the AI backend. It handles user input, displays responses, manages tool approvals, and coordinates the avatar's video and voice features.

---

## Chunk 1: Tool Approval Handling

```javascript
function addApprovalButtons(toolCall) {
    const wrapper = document.createElement('div');
    wrapper.className = 'chat-message ai';
    const div = document.createElement('div');
    div.className = 'tool-approval-buttons';
    
    const labels = { send_documents: '<i class="fas fa-file-pdf"></i> Send Documents', schedule_meeting: '<i class="fas fa-calendar-alt"></i> Schedule Meeting' };
    
    const approveBtn = document.createElement('button');
    approveBtn.className = 'btn btn-approve';
    approveBtn.innerHTML = labels[toolCall.function] || '<i class="fas fa-check"></i> Proceed';
    approveBtn.onclick = async () => {
        const tool = state.pendingToolCall;
        if (!tool) return;
        div.innerHTML = '<span style="opacity:0.6"><i class="fas fa-spinner fa-spin"></i> Processing...</span>';
        setThinkingState(true);
        state.pendingToolCall = null;
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: '', history: state.conversationHistory.slice(-4), toolExecutionData: tool })
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setThinkingState(false);
            state.conversationHistory.push({ role: 'assistant', content: data.response });
            displayResponse(data.response, [], () => {
                if (data.schedulingUrl) addSchedulingCard(data.schedulingUrl, data.eventName, data.duration);
            });
        } catch {
            setThinkingState(false);
            displayResponse("I had trouble with that. Please try again.", []);
        }
    };
```

When the AI requests a tool call, this function creates approval buttons in the chat. The approve button shows a loading spinner when clicked, then sends the tool execution data back to the server. The server executes the actual tool and returns the result, which is then displayed to the user. If the tool was schedule_meeting, it also shows a scheduling card with the Calendly link.

---

## Chunk 2: Cancel Button and Chat Integration

```javascript
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-cancel';
    cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
    cancelBtn.onclick = () => {
        state.pendingToolCall = null;
        div.innerHTML = '<span style="opacity:0.6">Cancelled</span>';
        const msg = "No problem! Let me know if you need anything else.";
        addToChatHistory(msg, false);
        state.conversationHistory.push({ role: 'assistant', content: msg });
    };
    
    div.appendChild(approveBtn);
    div.appendChild(cancelBtn);
    wrapper.appendChild(div);
    elements.chatHistory?.appendChild(wrapper);
    scrollToBottom();
}
```

The cancel button clears the pending tool call and shows a friendly cancellation message. Both buttons are added to a wrapper div that gets appended to the chat history. The scrollToBottom call ensures the new buttons are visible.

---

## Chunk 3: Scheduling Card Display

```javascript
function addSchedulingCard(url, eventName, duration) {
    const card = document.createElement('div');
    card.className = 'chat-message ai scheduling-card';
    card.innerHTML = `
        <div class="message-content">
            <div class="scheduling-card-header"><i class="fas fa-calendar-alt"></i><h3>${eventName || 'Schedule a Meeting'}</h3></div>
            ${duration ? `<p class="scheduling-duration">${duration} minutes</p>` : ''}
            <a href="${url}" target="_blank" rel="noopener" class="scheduling-link-btn"><i class="fas fa-external-link-alt"></i> Open Calendar</a>
            <button class="copy-link-btn" onclick="copySchedulingLink('${url}')"><i class="fas fa-copy"></i> Copy Link</button>
        </div>
    `;
    elements.chatHistory?.appendChild(card);
    scrollToBottom();
    setTimeout(() => card.classList.add('visible'), 100);
}

window.copySchedulingLink = url => {
    navigator.clipboard.writeText(url).then(() => {
        const btn = document.querySelector('.copy-link-btn');
        if (!btn) return;
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 2000);
    }).catch(() => {});
};
```

After a scheduling tool succeeds, this function creates a visually distinct card showing the event name and duration. It provides both a button to open the Calendly link and a button to copy the link. The copy button changes to show "Copied!" with a green background for 2 seconds before reverting. The card animates in with a slight delay for visual polish.

---

# Architecture Summary

The agentic AI system follows a human-in-the-loop pattern where the AI can propose actions but requires user approval before executing them. This ensures users maintain control while benefiting from AI automation.

**Flow:**
1. User sends message → `avatar.js` → `/api/chat`
2. `chat.js` processes with Llama 3.3 70B
3. If tool needed → returns `requiresApproval: true`
4. Frontend shows approval buttons
5. User approves → `chat.js` calls tool endpoint
6. Tool executes → result displayed to user

**Key Design Decisions:**
- Tools require explicit user approval for safety
- Parameter validation catches AI hallucinations
- Graceful fallbacks for all external services
- Rate limiting prevents abuse
- LinkedIn search enhances personalization

