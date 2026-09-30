const AppError = require('../utils/AppError');

// Takes a Zod schema, returns Express middleware
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
        // Collect all issues into one readable message
        const message = result.error.issues
            .map((issue) => issue.message)
            .join(', ');
        return next(new AppError(message, 400));
    }

    req.body = result.data; // now type-coerced & trimmed per schema
    next();
};

module.exports = validate;