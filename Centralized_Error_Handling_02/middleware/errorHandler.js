function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const isOperational = err.isOperational || false;

    // Log unexpected errors loudly — these are bugs, not user mistakes
    if (!isOperational) {
        console.error('UNEXPECTED ERROR:', err);
    }

    res.status(statusCode).json({
        success: false,
        message: isOperational ? err.message : 'Something went wrong',
        // stack only in dev — never leak this in production
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}

module.exports = errorHandler;