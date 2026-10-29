const AppError = require('../utils/AppError');
const { ROLE_PERMISSIONS } = require('../config/roles');

function hasPermission(role, permission) {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// Coarse check: allowed if the user's role is in the list
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
    if (!req.user) return next(new AppError('Not authenticated', 401));
    if (!allowedRoles.includes(req.user.role)) {
        return next(new AppError('Forbidden: insufficient role', 403));
    }
    next();
};

// Fine-grained check: allowed if the user's role grants this permission
const can = (permission) => (req, res, next) => {
    if (!req.user) return next(new AppError('Not authenticated', 401));
    if (!hasPermission(req.user.role, permission)) {
        return next(new AppError(`Forbidden: requires ${permission}`, 403));
    }
    next();
};

// Ownership check: allowed if the resource is the user's own,
// OR their role grants the permission (e.g. admin viewing anyone)
const selfOrCan = (permission) => (req, res, next) => {
    if (!req.user) return next(new AppError('Not authenticated', 401));
    const isSelf = req.user.id === req.params.id;
    if (isSelf || hasPermission(req.user.role, permission)) return next();
    next(new AppError('Forbidden: you can only access your own data', 403));
};

module.exports = { authorizeRoles, can, selfOrCan, hasPermission };