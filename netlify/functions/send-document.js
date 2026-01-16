const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');
const { checkRateLimit, isValidEmail, log, logError, errorResponse, successResponse, checkMethod } = require('./utils');

const AVAILABLE_DOCUMENTS = {
    resume: { path: 'Disha Sawant Resume 2025.pdf', name: 'Disha_Sawant_Resume_2025.pdf', description: 'Resume' }
};

exports.handler = async (event) => {
    const methodCheck = checkMethod(event.httpMethod);
    if (methodCheck) return methodCheck;

    try {
        const { recipientEmail, recipientName, documents, context } = JSON.parse(event.body);

        log('📧 Send Document Request:', { recipientName, recipientEmail, documents });

        if (!recipientEmail || !recipientName || !documents || !Array.isArray(documents)) {
            return errorResponse(400, "Missing required fields: recipientEmail, recipientName, documents (array)");
        }

        if (!isValidEmail(recipientEmail)) return errorResponse(400, "Invalid email address");

        const rateLimit = checkRateLimit(`document:${recipientEmail}`, 3, 86400000);
        if (!rateLimit.allowed) {
            return errorResponse(429, `Rate limit exceeded. Try again in ${rateLimit.retryAfter} minutes.`);
        }

        const attachments = [], documentList = [];

        for (const docKey of documents) {
            const doc = AVAILABLE_DOCUMENTS[docKey];
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
                } catch (e) {
                    logError(`Error reading file ${doc.path}:`, e.message);
                }
            }
        }

        if (!attachments.length) return errorResponse(400, "No valid documents found or files could not be read");

        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        const contextInfo = context ? `\n\n${context}` : '';
        
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #d48466;">Hi ${recipientName},</h2>
                <p style="line-height: 1.6; color: #333;">Thanks for your interest! As discussed, I'm sharing my ${documentList.join(' and ')} with you.</p>
                ${contextInfo ? `<p style="line-height: 1.6; color: #333;">${contextInfo}</p>` : ''}
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #d48466; margin-top: 0;">About Me</h3>
                    <ul style="line-height: 1.8; color: #333;">
                        <li>MS in Computer Engineering at SDSU (AI focus)</li>
                        <li>Recent AI Engineering Intern at Ema Unlimited</li>
                        <li>Strong background in ML, agentic AI, and full-stack development</li>
                    </ul>
                </div>
                <p style="line-height: 1.6; color: #333;">I've attached my ${documentList.join(' and ')} for your review. Feel free to reach out or schedule a call.</p>
                <div style="margin: 30px 0;">
                    <a href="https://calendly.com/dishasawantt" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #d48466, #f7ce68); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">📅 Schedule a Call</a>
                </div>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="margin: 5px 0;"><strong>Best regards,</strong><br>Disha Sawant</p>
                <p style="font-size: 14px; color: #666;">📧 dishasawantt@gmail.com | 🔗 <a href="https://dishasawantt.github.io/resume" style="color: #d48466;">Portfolio</a> | 💼 <a href="https://linkedin.com/in/disha-sawant-7877b21b6" style="color: #d48466;">LinkedIn</a></p>
            </div>
        `;

        const textContent = `Hi ${recipientName},\n\nThanks for your interest! I'm sharing my ${documentList.join(' and ')} with you.${contextInfo}\n\nAbout Me:\n- MS in Computer Engineering at SDSU (AI focus)\n- Recent AI Engineering Intern at Ema Unlimited\n- Strong background in ML, agentic AI, and full-stack development\n\nBest regards,\nDisha Sawant\n📧 dishasawantt@gmail.com\n🔗 https://dishasawantt.github.io/resume\n💼 https://linkedin.com/in/disha-sawant-7877b21b6`;

        log('📤 Sending email via SendGrid to:', recipientEmail);

        const result = await sgMail.send({
            to: recipientEmail,
            from: { email: 'dishasawantt@gmail.com', name: 'Disha Sawant' },
            subject: `Disha Sawant - ${documentList.join(' & ')}`,
            text: textContent,
            html: htmlContent,
            attachments
        });
        
        log('✅ SendGrid Response:', result[0]?.statusCode);

        return successResponse({ 
            success: true, 
            messageId: result[0]?.headers?.['x-message-id'],
            message: `Documents sent successfully to ${recipientEmail}`,
            documentsSent: documentList
        });

    } catch (error) {
        logError("Document sending error:", error.message);
        if (error.response) logError("SendGrid error details:", error.response.body);
        return errorResponse(500, "Failed to send documents", error.message);
    }
};
