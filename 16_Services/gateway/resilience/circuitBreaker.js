const { ServiceError } = require('../errors');

// Only infrastructure failures count. NOT_FOUND / FAILED_PRECONDITION mean the
// service is healthy and simply said "no", so they must never trip the breaker.
const TRIPPING_CODES = new Set(['UNAVAILABLE', 'DEADLINE_EXCEEDED', 'INTERNAL']);

class CircuitBreaker {
    constructor({ name, failureThreshold = 5, resetTimeoutMs = 10000 }) {
        this.name = name;
        this.failureThreshold = failureThreshold;
        this.resetTimeoutMs = resetTimeoutMs;
        this.state = 'CLOSED'; // CLOSED = normal, OPEN = fail fast, HALF_OPEN = testing recovery
        this.failures = 0;
        this.openedAt = 0;
        this.trialInFlight = false;
    }

    async exec(fn) {
        if (this.state === 'OPEN') {
            if (Date.now() - this.openedAt < this.resetTimeoutMs) throw this.openError();
            this.state = 'HALF_OPEN';
            console.log(`[breaker:${this.name}] HALF_OPEN, allowing one trial request`);
        }

        if (this.state === 'HALF_OPEN') {
            if (this.trialInFlight) throw this.openError(); // only ONE probe at a time
            this.trialInFlight = true;
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (err) {
            if (err instanceof ServiceError && TRIPPING_CODES.has(err.code)) this.onFailure();
            else if (err instanceof ServiceError) this.onSuccess();
            else this.trialInFlight = false; // our own bug, not the downstream's health
            throw err;
        }
    }

    openError() {
        return new ServiceError('CIRCUIT_OPEN', `${this.name} circuit is open, failing fast`);
    }

    onSuccess() {
        if (this.state !== 'CLOSED') console.log(`[breaker:${this.name}] CLOSED (service recovered)`);
        this.state = 'CLOSED';
        this.failures = 0;
        this.trialInFlight = false;
    }

    onFailure() {
        this.trialInFlight = false;
        this.failures++;
        // A failed probe re-opens immediately; otherwise open at the threshold
        if (this.state === 'HALF_OPEN' || this.failures >= this.failureThreshold) {
            if (this.state !== 'OPEN') console.log(`[breaker:${this.name}] OPEN after ${this.failures} failure(s)`);
            this.state = 'OPEN';
            this.openedAt = Date.now();
        }
    }

    snapshot() {
        return {
            name: this.name,
            state: this.state,
            consecutiveFailures: this.failures,
            failureThreshold: this.failureThreshold,
            retryInMs: this.state === 'OPEN' ? Math.max(0, this.resetTimeoutMs - (Date.now() - this.openedAt)) : 0,
        };
    }
}

module.exports = CircuitBreaker;