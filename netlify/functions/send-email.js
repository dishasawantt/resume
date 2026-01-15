const sgMail = require('@sendgrid/mail');
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

exports.handler = async (event) => {
    const methodCheck = checkMethod(event.httpMethod);
    if (methodCheck) return methodCheck;

    try {
        const { visitorName, visitorEmail, message, context } = JSON.parse(event.body);

        // Validate required fields
        if (!visitorName || !visitorEmail || !message) {
            return errorResponse(400, "Missing required fields: visitorName, visitorEmail, message");
        }

        if (!isValidEmail(visitorEmail)) {
            return errorResponse(400, "Invalid email address");
        }

        // Rate limiting
        const clientIP = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';
        const rateLimit = checkRateLimit(`visitor-email:${clientIP}`, 3, 3600000);
        if (!rateLimit.allowed) {
            return errorResponse(429, `Rate limit exceeded. Please try again in ${rateLimit.retryAfter} minutes.`);
        }

        log('📧 Sending contact email from:', visitorName, visitorEmail);

        // Initialize SendGrid
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
                <p style="font-size: 12px; color: #666;">
                    Sent via AI Portfolio Assistant. Reply directly to respond to ${visitorName}.
                </p>
            </div>
        `;

        const msg = {
            to: 'dishasawantt@gmail.com',
            from: {
                email: 'dishasawantt@gmail.com',
                name: 'Portfolio Assistant'
            },
            replyTo: visitorEmail,
            subject: `Portfolio Inquiry from ${visitorName}`,
            text: `New Message from Portfolio Visitor\n\nName: ${visitorName}\nEmail: ${visitorEmail}\n${context ? `Context: ${context}\n` : ''}\nMessage:\n${message}`,
            html: htmlContent
        };

        const result = await sgMail.send(msg);

        log('✅ Email sent, status:', result[0]?.statusCode);

        return successResponse({ 
            success: true, 
            messageId: result[0]?.headers?.['x-message-id'],
            message: "Message sent successfully to Disha" 
        });

    } catch (error) {
        logError("Email sending error:", error.message);
        if (error.response) {
            logError("SendGrid error details:", error.response.body);
        }
        return errorResponse(500, "Failed to send email", error.message);
    }
};
