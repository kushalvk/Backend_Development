const AppError = require('../utils/AppError');
const { allowedOrigins } = require('../config/origins');

function csrfGuard(req, res, next) {
    // Layer 2: Origin (or Referer fallback) must be on the allowlist.
    // Browsers always send Origin on cross-site POSTs, and a page can't forge it.
    let source = req.headers.origin;

    if (!source && req.headers.referer) {
        try {
            source = new URL(req.headers.referer).origin;
        } catch {
            /* malformed referer, treated as missing */
        }
    }

    if (!source || !allowedOrigins.includes(source)) {
        return next(new AppError('CSRF check failed: origin not allowed', 403));
    }

    // Layer 3: a custom header forces a CORS preflight for cross-origin
    // requests, and the preflight fails for origins we don't allow.
    // A plain <form> can't set custom headers at all.
    if (req.headers['x-requested-with'] !== 'XMLHttpRequest') {
        return next(new AppError('CSRF check failed: missing required header', 403));
    }

    next();
}

module.exports = csrfGuard;