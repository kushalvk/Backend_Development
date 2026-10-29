function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;

    if (!err.isOperational) console.error('UNEXPECTED ERROR:', err);

    res.status(statusCode).json({
        success: false,
        message: err.isOperational ? err.message : 'Something went wrong',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}

module.exports = errorHandler;