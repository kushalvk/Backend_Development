const { Queue } = require('bullmq');
const { producerConnection } = require('../config/redis');

const QUEUES = {
    NOTIFICATIONS: 'notifications',
    AUCTION_CLOSE: 'auction-close',
};

const notificationQueue = new Queue(QUEUES.NOTIFICATIONS, {
    connection: producerConnection,
    defaultJobOptions: {
        attempts: 4,                                  // 1 try + 3 retries
        backoff: { type: 'exponential', delay: 2000 }, // waits 2s, 4s, 8s between tries
        removeOnComplete: { age: 3600, count: 1000 },  // keep recent successes for 1h
        removeOnFail: { age: 7 * 24 * 3600 },          // keep failures 7 days = our dead-letter store
    },
});

const auctionCloseQueue = new Queue(QUEUES.AUCTION_CLOSE, {
    connection: producerConnection,
    defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: { age: 24 * 3600 },
    },
});

module.exports = { QUEUES, notificationQueue, auctionCloseQueue };