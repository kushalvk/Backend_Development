const AppError = require('../utils/AppError');

// Mongo operators start with "$"; dots enable path traversal in updates
function hasDangerousKeys(value) {
    if (value && typeof value === 'object') {
        for (const key of Object.keys(value)) {
            if (key.startsWith('$') || key.includes('.')) return true;
            if (hasDangerousKeys(value[key])) return true;
        }
    }
    return false;
}

function noSqlGuard(req, res, next) {
    // Read-only inspection, so it works with Express 5's immutable req.query
    if (hasDangerousKeys(req.body) || hasDangerousKeys(req.query) || hasDangerousKeys(req.params)) {
        return next(new AppError('Invalid characters in request', 400));
    }
    next();
}

module.exports = noSqlGuard;