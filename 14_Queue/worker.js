require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { auctionCloseQueue } = require('./queues');
const createNotificationWorker = require('./workers/notification.worker');
const createAuctionCloseWorker = require('./workers/auctionClose.worker');

async function main() {
    await connectDB();

    const notificationWorker = createNotificationWorker();
    const closeWorker = createAuctionCloseWorker();

    // Repeatable job: upsert is idempotent, so restarting the worker never
    // creates duplicate schedules. (Requires bullmq >= 5.16.)
    await auctionCloseQueue.upsertJobScheduler(
        'sweep-expired',
        { every: 60_000 },
        { name: 'sweep', data: {} }
    );

    console.log('Workers running: notifications, auction-close, sweeper (every 60s)');

    // Graceful shutdown: finish in-flight jobs instead of killing them mid-way
    const shutdown = async () => {
        console.log('Shutting down workers...');
        await Promise.all([notificationWorker.close(), closeWorker.close()]);
        await mongoose.disconnect();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

main();