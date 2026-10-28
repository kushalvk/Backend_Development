const rateLimit = require('express-rate-limit');

// App-wide safety net
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
});

// Brute-force protection for /login: only FAILED attempts count,
// so a legitimate user logging in successfully is never throttled.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

module.exports = { apiLimiter, authLimiter };