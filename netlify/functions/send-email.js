const { Resend } = require('resend');

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

exports.handler = async (event) => {
    if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
    if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

    try {
        const { visitorName, visitorEmail, message, context } = JSON.parse(event.body);

        if (!visitorName || !visitorEmail || !message) {
            return { 
                statusCode: 400, 
                headers, 
                body: JSON.stringify({ error: "Missing required fields: visitorName, visitorEmail, message" }) 
            };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(visitorEmail)) {
            return { 
                statusCode: 400, 
                headers, 
                body: JSON.stringify({ error: "Invalid email address" }) 
            };
        }

        const clientIP = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';
        const rateLimit = checkRateLimit(`visitor-email:${clientIP}`, 3, 3600000);

        if (!rateLimit.allowed) {
            return {
                statusCode: 429,
                headers,
                body: JSON.stringify({ 
                    error: `Rate limit exceeded. Please try again in ${rateLimit.retryAfter} minutes.` 
                })
            };
        }

        const resend = new Resend(process.env.RESEND_API_KEY);

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d48466;">New Message from Portfolio Visitor</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Name:</strong> ${visitorName}</p>
                    <p><strong>Email:</strong> <a href="mailto:${visitorEmail}">${visitorEmail}</a></p>
                    ${context ? `<p><strong>Context:</strong> ${context}</p>` : ''}
                </div>
                <div style="line-height: 1.6; color: #333; margin: 20px 0;">
                    <h3 style="color: #d48466;">Message:</h3>
                    <p style="white-space: pre-wrap;">${message}</p>
                </div>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <div style="font-size: 12px; color: #666;">
                    <p>This message was sent via your AI Portfolio Assistant</p>
                    <p>Reply directly to this email to respond to ${visitorName}</p>
                </div>
            </div>
        `;

        const textContent = `New Message from Portfolio Visitor\n\nName: ${visitorName}\nEmail: ${visitorEmail}\n${context ? `Context: ${context}\n` : ''}\nMessage:\n${message}\n\n---\nSent via AI Portfolio Assistant`;

        const result = await resend.emails.send({
            from: 'Portfolio Assistant <onboarding@resend.dev>',
            to: ['dishasawantt@gmail.com'],
            replyTo: visitorEmail,
            subject: `Portfolio Inquiry from ${visitorName}`,
            html: htmlContent,
            text: textContent
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                messageId: result.id,
                message: "Message sent successfully to Disha" 
            })
        };

    } catch (error) {
        console.error("Email sending error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: "Failed to send email", 
                details: error.message 
            })
        };
    }
};

