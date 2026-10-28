const AppError = require('../utils/AppError');

// source: 'body' (default) | 'params' | 'query'
const validate = (schema, source = 'body') => (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
        const message = result.error.issues.map((i) => i.message).join(', ');
        return next(new AppError(message, 400));
    }
    // Express 5 makes req.query read-only, so only overwrite body
    if (source === 'body') req.body = result.data;
    next();
};

module.exports = validate;