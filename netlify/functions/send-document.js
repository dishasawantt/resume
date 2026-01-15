const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
};

const rateLimitMap = new Map();

function checkRateLimit(identifier, maxRequests = 3, windowMs = 3600000) {
    const now = Date.now();
    const userRequests = rateLimitMap.get(identifier) || [];
    const recentRequests = userRequests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
        return { allowed: false, retryAfter: Math.ceil((windowMs - (now - recentRequests[0])) / 60000) };
    }
    
    recentRequests.push(now);
    rateLimitMap.set(identifier, recentRequests);
    return { allowed: true };
}

const AVAILABLE_DOCUMENTS = {
    resume: {
        path: 'Disha Sawant Resume 2025.pdf',
        name: 'Disha_Sawant_Resume_2025.pdf',
        description: 'Resume'
    }
};

exports.handler = async (event) => {
    if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
    if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

    try {
        const { recipientEmail, recipientName, documents, context } = JSON.parse(event.body);

        if (!recipientEmail || !recipientName || !documents || !Array.isArray(documents)) {
            return { 
                statusCode: 400, 
                headers, 
                body: JSON.stringify({ error: "Missing required fields: recipientEmail, recipientName, documents (array)" }) 
            };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(recipientEmail)) {
            return { 
                statusCode: 400, 
                headers, 
                body: JSON.stringify({ error: "Invalid email address" }) 
            };
        }

        const clientIP = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';
        const rateLimit = checkRateLimit(`document:${recipientEmail}`, 3, 86400000);

        if (!rateLimit.allowed) {
            return {
                statusCode: 429,
                headers,
                body: JSON.stringify({ 
                    error: `Rate limit exceeded. You can request documents again in ${rateLimit.retryAfter} minutes.` 
                })
            };
        }

        const resend = new Resend(process.env.RESEND_API_KEY);

        const attachments = [];
        const documentList = [];

        for (const docKey of documents) {
            const doc = AVAILABLE_DOCUMENTS[docKey];
            if (doc) {
                try {
                    const filePath = path.join(process.cwd(), doc.path);
                    const fileContent = fs.readFileSync(filePath);
                    attachments.push({
                        filename: doc.name,
                        content: fileContent
                    });
                    documentList.push(doc.description);
                } catch (fileError) {
                    console.error(`Error reading file ${doc.path}:`, fileError);
                }
            }
        }

        if (attachments.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "No valid documents found or files could not be read" })
            };
        }

        const contextInfo = context ? `\n\n${context}` : '';
        
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d48466;">Hi ${recipientName},</h2>
                <p style="line-height: 1.6; color: #333;">
                    Thanks for your interest! As discussed, I'm sharing my ${documentList.join(' and ')} with you.
                </p>
                ${contextInfo ? `<p style="line-height: 1.6; color: #333;">${contextInfo}</p>` : ''}
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #d48466; margin-top: 0;">About Me</h3>
                    <ul style="line-height: 1.8; color: #333;">
                        <li>MS in Computer Engineering at SDSU (AI focus)</li>
                        <li>Recent AI Engineering Intern at Ema Unlimited</li>
                        <li>Strong background in ML, agentic AI, and full-stack development</li>
                    </ul>
                </div>
                <p style="line-height: 1.6; color: #333;">
                    I've attached my ${documentList.join(' and ')} for your review. If you'd like to discuss opportunities 
                    or learn more about my projects, feel free to reach out or schedule a call.
                </p>
                <div style="margin: 30px 0;">
                    <a href="https://calendly.com/dishasawantt" 
                       style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #d48466, #f7ce68); 
                              color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                        📅 Schedule a Call
                    </a>
                </div>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <div style="line-height: 1.6; color: #333;">
                    <p style="margin: 5px 0;"><strong>Best regards,</strong><br>Disha Sawant</p>
                    <p style="font-size: 14px; color: #666; margin: 15px 0 5px 0;">
                        📧 dishasawantt@gmail.com<br>
                        🔗 <a href="https://dishasawantt.github.io/resume" style="color: #d48466;">Portfolio</a><br>
                        💼 <a href="https://linkedin.com/in/disha-sawant-7877b21b6" style="color: #d48466;">LinkedIn</a>
                    </p>
                </div>
            </div>
        `;

        const textContent = `Hi ${recipientName},

Thanks for your interest! As discussed, I'm sharing my ${documentList.join(' and ')} with you.
${contextInfo}

About Me:
- MS in Computer Engineering at SDSU (AI focus)
- Recent AI Engineering Intern at Ema Unlimited
- Strong background in ML, agentic AI, and full-stack development

I've attached my ${documentList.join(' and ')} for your review. If you'd like to discuss opportunities or learn more about my projects, feel free to reach out or schedule a call at https://calendly.com/dishasawantt

Best regards,
Disha Sawant

📧 dishasawantt@gmail.com
🔗 Portfolio: https://dishasawantt.github.io/resume
💼 LinkedIn: https://linkedin.com/in/disha-sawant-7877b21b6`;

        const result = await resend.emails.send({
            from: 'Disha Sawant <onboarding@resend.dev>',
            to: [recipientEmail],
            subject: `Disha Sawant - ${documentList.join(' & ')}`,
            html: htmlContent,
            text: textContent,
            attachments: attachments
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                messageId: result.id,
                message: `Documents sent successfully to ${recipientEmail}`,
                documentsSent: documentList
            })
        };

    } catch (error) {
        console.error("Document sending error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: "Failed to send documents", 
                details: error.message 
            })
        };
    }
};

