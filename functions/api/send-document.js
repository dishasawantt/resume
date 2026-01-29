const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email) {
    return EMAIL_REGEX.test(email);
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
        const { recipientEmail, recipientName, documents, context: emailContext } = await request.json();

        if (!recipientEmail || !recipientName || !Array.isArray(documents)) {
            return jsonResponse({ error: "Missing required fields" }, 400);
        }
        
        if (!isValidEmail(recipientEmail)) {
            return jsonResponse({ error: "Invalid email" }, 400);
        }

        const SENDGRID_API_KEY = env.SENDGRID_API_KEY;
        
        if (!SENDGRID_API_KEY) {
            console.error("SendGrid API key not configured");
            return jsonResponse({ 
                success: false, 
                error: "Email service not configured. Please download resume from the portfolio page." 
            }, 500);
        }

        const documentList = documents.includes("resume") ? ["Resume"] : [];
        
        if (!documentList.length) {
            return jsonResponse({ error: "No valid documents" }, 400);
        }

        const html = `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                <h2 style="color:#d48466">Hi ${recipientName},</h2>
                <p style="line-height:1.6;color:#333">Thanks for your interest! I'm sharing my ${documentList.join(' and ')} with you.</p>
                ${emailContext ? `<p style="line-height:1.6;color:#333">${emailContext}</p>` : ''}
                <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0">
                    <h3 style="color:#d48466;margin-top:0">About Me</h3>
                    <ul style="line-height:1.8;color:#333">
                        <li>MS in Computer Engineering at SDSU (AI focus)</li>
                        <li>Recent AI Engineering Intern at Ema Unlimited</li>
                        <li>Strong background in ML, agentic AI, and full-stack development</li>
                    </ul>
                </div>
                <p style="line-height:1.6;color:#333">You can download my resume directly from my portfolio:</p>
                <div style="margin:30px 0">
                    <a href="https://dishasawantt.github.io/resume/Disha%20Sawant%20Resume%202025.pdf" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#d48466,#f7ce68);color:white;text-decoration:none;border-radius:8px;font-weight:600">📄 Download Resume</a>
                </div>
                <div style="margin:30px 0">
                    <a href="https://calendly.com/dishasawantt" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#d48466,#f7ce68);color:white;text-decoration:none;border-radius:8px;font-weight:600">📅 Schedule a Call</a>
                </div>
                <hr style="margin:30px 0;border:none;border-top:1px solid #eee">
                <p style="margin:5px 0"><strong>Best regards,</strong><br>Disha Sawant</p>
                <p style="font-size:14px;color:#666">📧 dishasawantt@gmail.com | 🔗 <a href="https://dishasawantt.github.io/resume" style="color:#d48466">Portfolio</a> | 💼 <a href="https://linkedin.com/in/disha-sawant-7877b21b6" style="color:#d48466">LinkedIn</a></p>
            </div>
        `;

        const text = `Hi ${recipientName},\n\nThanks for your interest! I'm sharing my ${documentList.join(' and ')} with you.\n\nYou can download my resume here:\nhttps://dishasawantt.github.io/resume/Disha%20Sawant%20Resume%202025.pdf\n\nAbout Me:\n- MS in Computer Engineering at SDSU (AI focus)\n- Recent AI Engineering Intern at Ema Unlimited\n- Strong background in ML, agentic AI, and full-stack development\n\nSchedule a call: https://calendly.com/dishasawantt\n\nBest regards,\nDisha Sawant\ndishasawantt@gmail.com`;

        const emailPayload = {
            personalizations: [{ to: [{ email: recipientEmail, name: recipientName }] }],
            from: { email: "dishasawantt@gmail.com", name: "Disha Sawant" },
            subject: `Disha Sawant - ${documentList.join(' & ')}`,
            content: [
                { type: "text/plain", value: text },
                { type: "text/html", value: html }
            ]
        };

        const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${SENDGRID_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(emailPayload)
        });

        if (response.ok || response.status === 202) {
            return jsonResponse({ 
                success: true, 
                documentsSent: documentList 
            });
        } else {
            const errorText = await response.text();
            console.error("SendGrid error:", response.status, errorText);
            return jsonResponse({ 
                success: false, 
                error: "Failed to send email" 
            }, 500);
        }

    } catch (error) {
        console.error("Send document error:", error.message);
        return jsonResponse({ error: "Failed to send" }, 500);
    }
}
