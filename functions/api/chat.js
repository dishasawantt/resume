import Groq from "groq-sdk";

const MY_BACKGROUND = {
    schools: ["SDSU", "San Diego State University", "University of Mumbai"],
    companies: ["Ema Unlimited", "Image Computers", "Saint Louis University", "GreatAlbum", "PlotMyData", "Beat The Virus"]
};

const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');

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

const PLACEHOLDER = /^(user|visitor|name|email|your|their|unknown|placeholder|recipient|test|sample|dummy|your name|the user|n\/a)$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
    return EMAIL_REGEX.test(email);
}

function validateToolParams(fn, args) {
    if (fn !== 'send_documents') return { valid: true };
    const { recipientName: name, recipientEmail: email } = args;
    
    if (!name || name.length < 2 || PLACEHOLDER.test(name.trim()) || /disha|sawant|your name|user's|user name|their name/i.test(name) || name.includes('@'))
        return { valid: false, message: "I'd be happy to send my resume! What's your name?" };
    if (!email?.includes('@') || !isValidEmail(email))
        return { valid: false, message: `Thanks ${name}! What's your email address?` };
    return { valid: true };
}

function sanitizeResponse(text) {
    return text?.replace(/function=\w+>[\s\S]*?(?:<\/function>|\})/g, '').replace(/\{"[^"]+":[\s\S]*?\}/g, '').trim() || null;
}

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

async function executeTool({ function: fn, arguments: args }, env) {
    if (fn === "schedule_meeting") {
        const urls = {
            quick_chat: "https://calendly.com/dishasawantt/15-minute-meeting",
            consultation: "https://calendly.com/dishasawantt/30min",
            interview: "https://calendly.com/dishasawantt/45-minute-meeting"
        };
        const durations = { quick_chat: 15, consultation: 30, interview: 45 };
        const names = { quick_chat: "15-Minute Call", consultation: "30-Minute Consultation", interview: "45-Minute Interview" };
        const type = args.meetingType || "consultation";
        
        return {
            success: true,
            response: "Here's the scheduling link!",
            schedulingUrl: urls[type] || urls.consultation,
            eventName: names[type] || names.consultation,
            duration: durations[type] || 30
        };
    }
    
    if (fn === "send_documents") {
        try {
            const baseUrl = env.SITE_URL || 'https://disha-portfolio.pages.dev';
            const res = await fetch(`${baseUrl}/api/send-document`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(args)
            });
            const result = await res.json();
            
            return result.success 
                ? { success: true, response: `Done! I've sent my resume to ${args.recipientEmail}. Check spam if needed!` }
                : { success: false, response: "Trouble sending. Download from the main page instead." };
        } catch (e) {
            console.error('Send document error:', e);
            return { success: false, response: "Trouble sending. Download from the main page instead." };
        }
    }
    
    return { success: false, response: "Unknown action" };
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
        }
    });
}

export async function onRequest(context) {
    const { request, env } = context;
    
    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        });
    }

    if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
    }

    try {
        const { message, history = [], toolExecutionData } = await request.json();
        
        if (toolExecutionData) {
            return jsonResponse(await executeTool(toolExecutionData, env));
        }
        
        if (!message || typeof message !== 'string') {
            return jsonResponse({ error: "Message required" }, 400);
        }

        const lastAssistant = history.slice().reverse().find(m => m.role === 'assistant');
        const isCollectingData = lastAssistant && /what's your (name|email)|provide.*email|your name\?/i.test(lastAssistant.content || '');
        
        let connectionContext = "", isConnectionQuery = false;
        if (!isCollectingData) {
            const nameQuery = extractNameQuery(message);
            if (nameQuery) {
                isConnectionQuery = true;
                connectionContext = `\n\n[LINKEDIN] Connection search for "${nameQuery}" - feature available on request.`;
            }
        }

        const cleanHistory = history.slice(-4).filter(msg => {
            if (msg.role !== 'assistant') return true;
            const c = msg.content?.toLowerCase() || '';
            if (/what's your|what is your/i.test(c)) return true;
            return !/(scheduling link|i'll send|i've sent|should i proceed)/i.test(c);
        });

        const groq = new Groq({ apiKey: env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: SYSTEM_PROMPT + connectionContext },
                ...cleanHistory,
                { role: "user", content: message }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 250,
            top_p: 0.9,
            tools: isConnectionQuery ? undefined : TOOLS,
            tool_choice: isConnectionQuery ? undefined : "auto"
        });

        const resp = completion.choices[0]?.message;
        
        if (resp.tool_calls?.length) {
            const { name: fn, arguments: argsStr } = resp.tool_calls[0].function;
            const args = JSON.parse(argsStr);
            const validation = validateToolParams(fn, args);
            
            if (!validation.valid) {
                return jsonResponse({ response: validation.message });
            }
            
            const preview = fn === 'schedule_meeting' 
                ? `I'll generate a scheduling link. One moment!`
                : `I'll send my resume to ${args.recipientEmail}. Proceed?`;
            
            return jsonResponse({
                response: sanitizeResponse(resp.content) || preview,
                toolCall: { function: fn, arguments: args, requiresApproval: true }
            });
        }

        return jsonResponse({ response: sanitizeResponse(resp.content) || "Could you rephrase that?" });

    } catch (error) {
        console.error("Chat API Error:", error.message);
        if (error.status === 429) {
            return jsonResponse({ error: "Rate limit. Please wait." }, 429);
        }
        return jsonResponse({ error: "Request failed. Try again." }, 500);
    }
}
