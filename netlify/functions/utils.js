const DEBUG = process.env.DEBUG === 'true';

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
};

const rateLimitMap = new Map();

function checkRateLimit(identifier, maxRequests = 3, windowMs = 3600000) {
    const now = Date.now();
    const recentRequests = (rateLimitMap.get(identifier) || []).filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
        return { allowed: false, retryAfter: Math.ceil((windowMs - (now - recentRequests[0])) / 60000) };
    }
    
    recentRequests.push(now);
    rateLimitMap.set(identifier, recentRequests);
    return { allowed: true };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = email => EMAIL_REGEX.test(email);

const log = (...args) => { if (DEBUG) console.log(...args); };
const logError = (...args) => console.error(...args);

const errorResponse = (statusCode, error, details = null) => ({
    statusCode,
    headers,
    body: JSON.stringify(details ? { error, details } : { error })
});

const successResponse = data => ({ statusCode: 200, headers, body: JSON.stringify(data) });
const handleOptions = () => ({ statusCode: 200, headers, body: "" });

function checkMethod(method, allowed = ['POST']) {
    if (method === 'OPTIONS') return handleOptions();
    if (!allowed.includes(method)) return errorResponse(405, 'Method not allowed');
    return null;
}

module.exports = { headers, checkRateLimit, isValidEmail, log, logError, errorResponse, successResponse, handleOptions, checkMethod, EMAIL_REGEX };
