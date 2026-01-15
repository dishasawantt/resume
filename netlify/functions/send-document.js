const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');
const { 
    headers, 
    checkRateLimit, 
    isValidEmail, 
    log, 
    logError, 
    errorResponse, 
    successResponse, 
    checkMethod 
} = require('./utils');

const AVAILABLE_DOCUMENTS = {
    resume: {
        path: 'Disha Sawant Resume 2025.pdf',
        name: 'Disha_Sawant_Resume_2025.pdf',
        description: 'Resume'
    }
};

exports.handler = async (event) => {
    const methodCheck = checkMethod(event.httpMethod);
    if (methodCheck) return methodCheck;

    try {
        const { recipientEmail, recipientName, documents, context } = JSON.parse(event.body);

        log('📧 Send Document Request:', { recipientName, recipientEmail, documents });

        // Validate required fields
        if (!recipientEmail || !recipientName || !documents || !Array.isArray(documents)) {
            return errorResponse(400, "Missing required fields: recipientEmail, recipientName, documents (array)");
        }

        if (!isValidEmail(recipientEmail)) {
            return errorResponse(400, "Invalid email address");
        }

        // Rate limiting (3 requests per day per email)
        const rateLimit = checkRateLimit(`document:${recipientEmail}`, 3, 86400000);
        if (!rateLimit.allowed) {
            return errorResponse(429, `Rate limit exceeded. You can request documents again in ${rateLimit.retryAfter} minutes.`);
        }

        // Load document attachments
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
                        content: fileContent.toString('base64'),
                        type: 'application/pdf',
                        disposition: 'attachment'
                    });
                    documentList.push(doc.description);
                } catch (fileError) {
                    logError(`Error reading file ${doc.path}:`, fileError.message);
                }
            }
        }

        if (attachments.length === 0) {
            return errorResponse(400, "No valid documents found or files could not be read");
        }

        // Initialize SendGrid
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
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
                    I've attached my ${documentList.join(' and ')} for your review. Feel free to reach out or schedule a call.
                </p>
                <div style="margin: 30px 0;">
                    <a href="https://calendly.com/dishasawantt" 
                       style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #d48466, #f7ce68); 
                              color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                        📅 Schedule a Call
                    </a>
                </div>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="margin: 5px 0;"><strong>Best regards,</strong><br>Disha Sawant</p>
                <p style="font-size: 14px; color: #666;">
                    📧 dishasawantt@gmail.com | 
                    🔗 <a href="https://dishasawantt.github.io/resume" style="color: #d48466;">Portfolio</a> | 
                    💼 <a href="https://linkedin.com/in/disha-sawant-7877b21b6" style="color: #d48466;">LinkedIn</a>
                </p>
            </div>
        `;

        const textContent = `Hi ${recipientName},

Thanks for your interest! I'm sharing my ${documentList.join(' and ')} with you.
${contextInfo}

About Me:
- MS in Computer Engineering at SDSU (AI focus)
- Recent AI Engineering Intern at Ema Unlimited
- Strong background in ML, agentic AI, and full-stack development

Best regards,
Disha Sawant
📧 dishasawantt@gmail.com
🔗 https://dishasawantt.github.io/resume
💼 https://linkedin.com/in/disha-sawant-7877b21b6`;

        log('📤 Sending email via SendGrid to:', recipientEmail);

        const msg = {
            to: recipientEmail,
            from: {
                email: 'dishasawantt@gmail.com',
                name: 'Disha Sawant'
            },
            subject: `Disha Sawant - ${documentList.join(' & ')}`,
            text: textContent,
            html: htmlContent,
            attachments: attachments
        };

        const result = await sgMail.send(msg);
        
        log('✅ SendGrid Response:', result[0]?.statusCode);

        return successResponse({ 
            success: true, 
            messageId: result[0]?.headers?.['x-message-id'],
            message: `Documents sent successfully to ${recipientEmail}`,
            documentsSent: documentList
        });

    } catch (error) {
        logError("Document sending error:", error.message);
        if (error.response) {
            logError("SendGrid error details:", error.response.body);
        }
        return errorResponse(500, "Failed to send documents", error.message);
    }
};
