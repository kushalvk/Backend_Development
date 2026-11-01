class ServiceError extends Error {
    // code: INVALID_ARGUMENT | NOT_FOUND | FAILED_PRECONDITION | UNAVAILABLE
    //       | DEADLINE_EXCEEDED | CIRCUIT_OPEN | INTERNAL
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}

const HTTP_STATUS = {
    INVALID_ARGUMENT: 400,
    NOT_FOUND: 404,
    FAILED_PRECONDITION: 409,
    UNAVAILABLE: 503,
    CIRCUIT_OPEN: 503,
    DEADLINE_EXCEEDED: 504,
    INTERNAL: 502, // the upstream broke, so Bad Gateway
};

module.exports = { ServiceError, HTTP_STATUS };