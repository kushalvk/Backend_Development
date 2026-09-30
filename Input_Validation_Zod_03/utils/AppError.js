class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true; // marks "expected" errors vs. bugs
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;