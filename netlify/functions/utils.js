const DEBUG = process.env.DEBUG === 'true';

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
};

const rateLimitMap = new Map();

const checkRateLimit = (id, max = 3, window = 3600000) => {
    const now = Date.now();
    const recent = (rateLimitMap.get(id) || []).filter(t => now - t < window);
    if (recent.length >= max) return { allowed: false, retryAfter: Math.ceil((window - (now - recent[0])) / 60000) };
    recent.push(now);
    rateLimitMap.set(id, recent);
    return { allowed: true };
};

const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const log = (...args) => DEBUG && console.log(...args);
const logError = (...args) => console.error(...args);
const errorResponse = (code, error, details = null) => ({ statusCode: code, headers, body: JSON.stringify(details ? { error, details } : { error }) });
const successResponse = data => ({ statusCode: 200, headers, body: JSON.stringify(data) });
const handleOptions = () => ({ statusCode: 200, headers, body: "" });

const checkMethod = (method, allowed = ['POST']) => {
    if (method === 'OPTIONS') return handleOptions();
    if (!allowed.includes(method)) return errorResponse(405, 'Method not allowed');
    return null;
};

module.exports = { headers, checkRateLimit, isValidEmail, log, logError, errorResponse, successResponse, handleOptions, checkMethod };
