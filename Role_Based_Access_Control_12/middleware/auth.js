const AppError = require('../utils/AppError');
const { verifyAccessToken } = require('../utils/token');

// Protects a route: requires a valid, unexpired access token
function authenticate(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return next(new AppError('Access token missing', 401));
    }

    try {
        const payload = verifyAccessToken(header.split(' ')[1]);
        req.user = { id: payload.sub, role: payload.role };
        next();
    } catch (err) {
        // Distinct message lets the frontend know to call /refresh
        const message = err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token';
        next(new AppError(message, 401));
    }
}

module.exports = { authenticate };