const AppError = require('../utils/AppError');

const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const message = result.error.issues.map((i) => i.message).join(', ');
        return next(new AppError(message, 400));
    }
    req.body = result.data;
    next();
};

module.exports = validate;