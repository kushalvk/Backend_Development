const { DomainError } = require('./errors');

const state = { latencyMs: 0, failRate: 0 };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Simulates a slow or flaky dependency so you can watch the gateway's
// timeouts, retries and circuit breaker react. Runtime-adjustable, no restart.
module.exports = {
    get: () => ({ ...state }),

    set: ({ latencyMs, failRate }) => {
        if (Number.isFinite(latencyMs) && latencyMs >= 0) state.latencyMs = latencyMs;
        if (Number.isFinite(failRate) && failRate >= 0 && failRate <= 1) state.failRate = failRate;
        return { ...state };
    },

    apply: async () => {
        if (state.latencyMs) await sleep(state.latencyMs);
        if (Math.random() < state.failRate) throw new DomainError('UNAVAILABLE', 'Injected failure');
    },
};