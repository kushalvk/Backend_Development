
const analyticsRepo = require('../repository/analytics.repository');

const FAILURE_RATE = Number(process.env.PROJECTION_FAILURE_RATE ?? 0);

// '0': start from the beginning so this read model can be rebuilt from history
module.exports = {
    group: 'analytics',
    startId: '0',
    handlers: {
        'bid.placed': async (event) => {
            // Fault injection so you can watch retries and the DLQ work
            if (Math.random() < FAILURE_RATE) throw new Error('Simulated projection failure');

            await analyticsRepo.recordBid(event);
            console.log(`[analytics] projected ${event.id}`);
        },
    },
};