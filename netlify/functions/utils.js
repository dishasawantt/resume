/**
 * Shared utilities for Netlify functions
 */

const DEBUG = process.env.DEBUG === 'true';

// Common CORS headers
const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
};

// In-memory rate limiting (resets on cold start)
const rateLimitMap = new Map();

/**
 * Check rate limit for an identifier
 * @param {string} identifier - Unique identifier (e.g., email or IP)
 * @param {number} maxRequests - Max requests allowed in window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {{allowed: boolean, retryAfter?: number}}
 */
function checkRateLimit(identifier, maxRequests = 3, windowMs = 3600000) {
    const now = Date.now();
    const userRequests = rateLimitMap.get(identifier) || [];
    const recentRequests = userRequests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= maxRequests) {
        return { 
            allowed: false, 
            retryAfter: Math.ceil((windowMs - (now - recentRequests[0])) / 60000) 
        };
    }
    
    recentRequests.push(now);
    rateLimitMap.set(identifier, recentRequests);
    return { allowed: true };
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email address
 * @param {string} email 
 * @returns {boolean}
 */
function isValidEmail(email) {
    return EMAIL_REGEX.test(email);
}

/**
 * Conditional debug logging
 * @param  {...any} args 
 */
function log(...args) {
    if (DEBUG) console.log(...args);
}

/**
 * Conditional error logging (always logs errors)
 * @param  {...any} args 
 */
function logError(...args) {
    console.error(...args);
}

/**
 * Create standard error response
 * @param {number} statusCode 
 * @param {string} error 
 * @param {string} details 
 * @returns {object}
 */
function errorResponse(statusCode, error, details = null) {
    return {
        statusCode,
        headers,
        body: JSON.stringify(details ? { error, details } : { error })
    };
}

/**
 * Create standard success response
 * @param {object} data 
 * @returns {object}
 */
function successResponse(data) {
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
    };
}

/**
 * Handle OPTIONS preflight request
 * @returns {object}
 */
function handleOptions() {
    return { statusCode: 200, headers, body: "" };
}

/**
 * Check if request method is allowed
 * @param {string} method 
 * @param {string[]} allowed 
 * @returns {object|null}
 */
function checkMethod(method, allowed = ['POST']) {
    if (method === 'OPTIONS') return handleOptions();
    if (!allowed.includes(method)) {
        return errorResponse(405, 'Method not allowed');
    }
    return null;
}

module.exports = {
    headers,
    checkRateLimit,
    isValidEmail,
    log,
    logError,
    errorResponse,
    successResponse,
    handleOptions,
    checkMethod,
    EMAIL_REGEX
};

