class DomainError extends Error {
    // code: INVALID_ARGUMENT | NOT_FOUND | FAILED_PRECONDITION | UNAVAILABLE
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}

module.exports = { DomainError };