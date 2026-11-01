require('dotenv').config();
const { clients } = require('../gateway/clients');

const CALLS = {
    getAuction: (client, ctx) => client.getAuction('6710a1b2c3d4e5f678901234', ctx),
    listAuctionsByRoom: (client, ctx) => client.listAuctionsByRoom('665f1a2b3c4d5e6f78901111', ctx),
};

const method = process.argv[2] || 'getAuction';
const TOTAL = Number(process.argv[3] || 2000);
const CONCURRENCY = Number(process.argv[4] || 50);

if (!CALLS[method]) {
    console.error(`Unknown method "${method}". Use: ${Object.keys(CALLS).join(', ')}`);
    process.exit(1);
}

async function bench(name, client) {
    const ctx = { requestId: `bench-${name}`, timeoutMs: 10000 };
    const latencies = [];
    let next = 0;

    for (let i = 0; i < 50; i++) await CALLS[method](client, ctx); // warm-up: connections, JIT

    const start = process.hrtime.bigint();
    async function worker() {
        while (next < TOTAL) {
            next++;
            const t0 = process.hrtime.bigint();
            await CALLS[method](client, ctx);
            latencies.push(Number(process.hrtime.bigint() - t0) / 1e6);
        }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    const seconds = Number(process.hrtime.bigint() - start) / 1e9;

    latencies.sort((a, b) => a - b);
    const pct = (p) => latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * p))].toFixed(2);
    const avg = latencies.reduce((sum, v) => sum + v, 0) / latencies.length;

    return {
        transport: name,
        'req/sec': Math.round(TOTAL / seconds),
        'avg ms': avg.toFixed(2),
        'p50 ms': pct(0.5),
        'p95 ms': pct(0.95),
        'p99 ms': pct(0.99),
    };
}

(async () => {
    console.log(`Benchmarking ${method}: ${TOTAL} requests, concurrency ${CONCURRENCY}`);
    const results = [];
    results.push(await bench('rest', clients.rest));
    results.push(await bench('grpc', clients.grpc));
    console.table(results);
    process.exit(0);
})();