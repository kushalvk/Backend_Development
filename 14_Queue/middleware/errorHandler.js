module.exports = function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const isOperational = err.isOperational || err.expose === true;

    if (!isOperational) console.error('UNEXPECTED ERROR:', err);

    res.status(statusCode).json({
        success: false,
        message: isOperational ? err.message : 'Something went wrong',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};