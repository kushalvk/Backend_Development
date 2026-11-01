const CircuitBreaker = require('./circuitBreaker');

const breaker = new CircuitBreaker({
    name: 'auction-service',
    failureThreshold: Number(process.env.CB_THRESHOLD || 5),
    resetTimeoutMs: Number(process.env.CB_RESET_MS || 10000),
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// CIRCUIT_OPEN is deliberately NOT retryable: hammering an open circuit defeats its purpose
const RETRYABLE = new Set(['UNAVAILABLE', 'DEADLINE_EXCEEDED']);

async function resilientCall(fn, { retries = 0, baseDelayMs = 100, label = 'call' } = {}) {
    let attempt = 0;
    while (true) {
        try {
            return await breaker.exec(fn); // every attempt passes through the breaker
        } catch (err) {
            if (!RETRYABLE.has(err.code) || attempt >= retries) throw err;
            attempt++;
            // Exponential backoff with jitter, so many callers don't retry in lockstep
            const delay = baseDelayMs * 2 ** (attempt - 1) * (0.5 + Math.random());
            console.warn(
                `[resilience] ${label} attempt ${attempt}/${retries + 1} failed (${err.code}), retrying in ${Math.round(delay)}ms`
            );
            await sleep(delay);
        }
    }
}

module.exports = { resilientCall, breaker };