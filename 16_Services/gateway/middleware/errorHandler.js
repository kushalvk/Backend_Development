const { ServiceError, HTTP_STATUS } = require('../errors');

module.exports = function errorHandler(err, req, res, next) {
    const isServiceError = err instanceof ServiceError;
    const status = isServiceError ? HTTP_STATUS[err.code] || 502 : err.expose ? err.statusCode || 400 : 500;

    if (!isServiceError && !err.expose) console.error(`[gateway] ${req.id} unexpected error:`, err);

    res.status(status).json({
        success: false,
        code: isServiceError ? err.code : undefined,
        message: isServiceError || err.expose ? err.message : 'Something went wrong',
        requestId: req.id,
    });
};