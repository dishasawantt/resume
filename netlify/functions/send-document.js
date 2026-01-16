const sgMail = require('@sendgrid/mail');
const fs = require('fs');
const path = require('path');
const { checkRateLimit, isValidEmail, log, logError, errorResponse, successResponse, checkMethod } = require('./utils');

const DOCS = { resume: { path: 'Disha Sawant Resume 2025.pdf', name: 'Disha_Sawant_Resume.pdf', desc: 'Resume' } };

exports.handler = async (event) => {
    const methodCheck = checkMethod(event.httpMethod);
    if (methodCheck) return methodCheck;

    try {
        const { recipientEmail, recipientName, documents, context } = JSON.parse(event.body);
        
        if (!recipientEmail || !recipientName || !documents?.length) {
            return errorResponse(400, "Missing: recipientEmail, recipientName, documents");
        }
        if (!isValidEmail(recipientEmail)) return errorResponse(400, "Invalid email");

        const rateLimit = checkRateLimit(`doc:${recipientEmail}`, 3, 86400000);
        if (!rateLimit.allowed) return errorResponse(429, `Rate limit. Try in ${rateLimit.retryAfter}min.`);

        const attachments = [], docList = [];
        for (const key of documents) {
            const doc = DOCS[key];
            if (doc) {
                try {
                    attachments.push({
                        filename: doc.name,
                        content: fs.readFileSync(path.join(process.cwd(), doc.path)).toString('base64'),
                        type: 'application/pdf',
                        disposition: 'attachment'
                    });
                    docList.push(doc.desc);
                } catch (e) { logError(`File error ${doc.path}:`, e.message); }
            }
        }
        if (!attachments.length) return errorResponse(400, "No valid documents");

        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#d48466">Hi ${recipientName},</h2>
            <p>Thanks for your interest! Attached is my ${docList.join(' & ')}.</p>
            ${context ? `<p>${context}</p>` : ''}
            <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0">
                <h3 style="color:#d48466;margin-top:0">About Me</h3>
                <ul><li>MS Computer Engineering @ SDSU (AI focus)</li><li>AI Engineering Intern @ Ema Unlimited</li><li>ML, Agentic AI, Full-stack</li></ul>
            </div>
            <a href="https://calendly.com/dishasawantt" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#d48466,#f7ce68);color:white;text-decoration:none;border-radius:8px">📅 Schedule a Call</a>
            <hr style="margin:30px 0;border:none;border-top:1px solid #eee">
            <p><strong>Best,</strong><br>Disha Sawant</p>
            <p style="font-size:14px;color:#666">📧 dishasawantt@gmail.com | <a href="https://linkedin.com/in/disha-sawant-7877b21b6" style="color:#d48466">LinkedIn</a></p>
        </div>`;

        log('📤 Sending to:', recipientEmail);
        const result = await sgMail.send({
            to: recipientEmail,
            from: { email: 'dishasawantt@gmail.com', name: 'Disha Sawant' },
            subject: `Disha Sawant - ${docList.join(' & ')}`,
            text: `Hi ${recipientName},\n\nAttached is my ${docList.join(' & ')}.\n\nBest,\nDisha Sawant\ndishasawantt@gmail.com`,
            html,
            attachments
        });
        
        log('✅ Sent:', result[0]?.statusCode);
        return successResponse({ success: true, message: `Sent to ${recipientEmail}`, documentsSent: docList });
    } catch (e) {
        logError("Send error:", e.message);
        if (e.response) logError("SendGrid:", e.response.body);
        return errorResponse(500, "Failed to send", e.message);
    }
};
