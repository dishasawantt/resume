const Groq = require("groq-sdk");
const fetch = require('node-fetch');
const connections = require("./connections.json");
const { isValidEmail, log, logError, errorResponse, successResponse, checkMethod } = require('./utils');

const MY_BACKGROUND = {
    schools: ["SDSU:2024:2026", "University of Mumbai:2018:2022"],
    companies: ["Ema Unlimited:2025", "Image Computers:2022:2024", "Saint Louis University:2022", "GreatAlbum:2021", "PlotMyData:2021", "Beat The Virus:2021"]
};

const normalize = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const searchConnections = query => {
    const terms = query.toLowerCase().split(/\s+/);
    return connections.filter(c => {
        const name = c.name.toLowerCase();
        return terms.some(t => name.includes(t) || name.split(' ').some(n => n.startsWith(t)));
    }).slice(0, 3);
};

const formatConnection = c => `${c.name}: ${c.title} at ${c.company}`;

const extractNameQuery = msg => {
    const lower = msg.toLowerCase();
    if (/mail|send|email|resume|cv|contact you|schedule|meeting|call|interview/i.test(lower)) return null;
    
    const patterns = [
        /do you know (\w+(?:\s+\w+)?)/i, /who is (\w+(?:\s+\w+)?)/i, /who'?s (\w+)/i,
        /connected (?:to|with) (\w+)/i, /is (\w+) (?:in )?your/i, /^(\w+)\??$/i
    ];
    
    for (const p of patterns) {
        const m = msg.match(p);
        if (m?.[1]?.length > 2 && !/^(you|your|me|my|the|this|what|how|why|can|i|a|an)$/i.test(m[1])) return m[1].trim();
    }
    return null;
};

const TOOLS = [{
    type: "function",
    function: {
        name: "send_documents",
        description: "Send resume when user says 'mail me/send me/email me resume'. Need actual name AND email.",
        parameters: {
            type: "object",
            properties: {
                recipientName: { type: "string" },
                recipientEmail: { type: "string" },
                documents: { type: "array", items: { type: "string", enum: ["resume"] } }
            },
            required: ["recipientName", "recipientEmail", "documents"]
        }
    }
}, {
    type: "function",
    function: {
        name: "schedule_meeting",
        description: "Book meeting when user asks to schedule/book a call/meeting/interview.",
        parameters: {
            type: "object",
            properties: { meetingType: { type: "string", enum: ["quick_chat", "consultation", "interview"] } },
            required: ["meetingType"]
        }
    }
}];

const SYSTEM_PROMPT = `You ARE Disha Sawant. This is your portfolio chatbot.

VOICE: Short, crisp, strategic. Talk like a real person, not a machine. Include tech details naturally in conversation. Never exaggerate or make things up - only state what's true.

CONTACT: dishasawantt@gmail.com | +1 619-918-7729 | San Diego
LinkedIn: linkedin.com/in/disha-sawant-7877b21b6 | GitHub: github.com/dishasawantt

EDUCATION: MS CompE @ SDSU (2024-26, 3.5 GPA, AI focus) | BS CompE @ Mumbai (2018-22, 3.7 GPA)

EXPERIENCE:
- AI Intern @ Ema Unlimited (Summer 2025): Built agentic workflows for insurance claims triage, Zendesk/Freshdesk automation, HR recruiting with Ashby API
- Data Engineer @ Image Computers (2022-24): ETL pipelines handling 500K+ daily records, predictive maintenance dashboards
- Earlier: Data roles at Saint Louis Univ, PlotMyData, Beat The Virus, GreatAlbum
Note: Currently a grad student at SDSU, not employed. Ema was a summer internship that ended.

PROJECTS:
- Brain Tumor AI: ResNet50 + ResUNet for MRI classification and segmentation
- Emotion AI: Dual CNN model - facial keypoints + emotion classification
- Credit Default: XGBoost on AWS SageMaker for loan predictions
- MathUI/VoiceUI: Web apps for handwriting recognition and voice control
- Quadrotor: PX4 + ROS + Gazebo flight simulation

SKILLS: Python, JavaScript, Java, SQL, TensorFlow, PyTorch, scikit-learn, React, FastAPI, AWS, Docker

22 Certifications (DeepLearning.AI, UCSD Big Data, IBM Data Science) | 72 LinkedIn Learning courses

TOOLS:
- send_documents: When they ask to mail/send resume → get their name and email first
- schedule_meeting: When they want to book a call → quick_chat=15min, consultation=30min, interview=45min
- Contact requests: Just share dishasawantt@gmail.com

RULES:
- Be honest. If you don't know something, say so.
- Keep it to 2-3 sentences max unless they ask for details.
- Sound human - contractions, natural flow, no corporate speak.
- Never show JSON or technical syntax.
- No emojis.`;

const PLACEHOLDER = /user'?s?|visitor|unknown|example\.com|test@|your_|\[.*\]|<.*>/i;

const validateToolParams = (fn, args) => {
    if (fn !== 'send_documents') return { valid: true };
    const { recipientName: name, recipientEmail: email } = args;
    
    const hasPlaceholder = str => !str || PLACEHOLDER.test(str);
    const nameIsEmail = name?.includes('@');
    
    if (hasPlaceholder(name) && hasPlaceholder(email)) {
        return { valid: false, message: "Sure, I can send you my resume! What's your name and email?" };
    }
    if (!name || name.length < 2 || hasPlaceholder(name) || nameIsEmail) {
        return { valid: false, message: "What's your name?" };
    }
    if (!email || hasPlaceholder(email)) {
        return { valid: false, message: `Got it, ${name}! What's your email address?` };
    }
    if (!isValidEmail(email)) {
        return { valid: false, message: `Hmm, "${email}" doesn't look right. Can you double-check that email?` };
    }
    return { valid: true };
};

const getToolPreview = (fn, args) => ({
    send_documents: `Perfect! I'll send my resume to ${args.recipientEmail}. Ready to send?`,
    schedule_meeting: `Great, I'll get you a ${args.meetingType === 'quick_chat' ? '15-minute' : args.meetingType === 'interview' ? '45-minute' : '30-minute'} scheduling link.`
})[fn] || "Should I proceed?";

const sanitizeResponse = text => {
    if (!text) return null;
    if (/\{.*".*":.*\}|function=|<\/function>|\[".*"\]/s.test(text)) return null;
    return text.replace(/\(function.*?\)/g, '').replace(/<[^>]+>/g, '').trim();
};

const executeTool = async ({ function: fn, arguments: args }) => {
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
                ? { success: true, response: `Done! Sent my resume to ${args.recipientEmail}. Check spam if needed!` }
                : { success: false, response: "Trouble sending. Download from main page instead." };
        }
        if (fn === 'schedule_meeting') {
            return result.success
                ? { success: true, response: `Here's your ${result.eventName} link!`, schedulingUrl: result.schedulingUrl, eventName: result.eventName, duration: result.duration }
                : { success: false, response: "Trouble generating link. Visit calendly.com/dishasawantt directly." };
        }
        return { success: false, response: "Unknown action" };
    } catch (e) {
        logError('Tool error:', e.message);
        return { success: false, response: "Error occurred. Email me at dishasawantt@gmail.com" };
    }
};

exports.handler = async (event) => {
    const methodCheck = checkMethod(event.httpMethod);
    if (methodCheck) return methodCheck;

    try {
        const { message, history = [], toolExecutionData } = JSON.parse(event.body);
        if (toolExecutionData) return successResponse(await executeTool(toolExecutionData));
        if (!message || typeof message !== 'string') return errorResponse(400, "Message required");

        let context = "";
        const nameQuery = extractNameQuery(message);
        if (nameQuery) {
            const matches = searchConnections(nameQuery);
            context = matches.length ? `\n[Found: ${matches.map(formatConnection).join('; ')}]` : `\n[No "${nameQuery}" in connections]`;
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: SYSTEM_PROMPT + context }, ...history.slice(-6), { role: "user", content: message }],
            model: "llama-3.1-8b-instant",
            temperature: 0.7,
            max_tokens: 300,
            tools: TOOLS,
            tool_choice: "auto"
        });

        const msg = completion.choices[0]?.message;
        
        if (msg.tool_calls?.length) {
            const { function: { name: fn, arguments: argsStr } } = msg.tool_calls[0];
            const args = JSON.parse(argsStr);
            log('Tool:', fn, args);
            
            const validation = validateToolParams(fn, args);
            if (!validation.valid) return successResponse({ response: validation.message });
            
            return successResponse({
                response: getToolPreview(fn, args),
                toolCall: { function: fn, arguments: args, requiresApproval: true }
            });
        }

        const cleanResponse = sanitizeResponse(msg.content) || "Could you rephrase that?";
        return successResponse({ response: cleanResponse });
    } catch (e) {
        logError("API Error:", e.message);
        return e.status === 429 
            ? errorResponse(429, "Rate limit hit. Wait a moment.")
            : errorResponse(500, "Request failed. Try again.");
    }
};
