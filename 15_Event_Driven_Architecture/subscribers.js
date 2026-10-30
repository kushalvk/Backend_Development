require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { producerConnection } = require('./config/redis');
// const { notificationQueue, auctionCloseQueue } = require('./queues');
const { createSubscriber } = require('./events/subscriber');

// Lazy requires so a subscriber file that doesn't exist yet (audit) only matters when selected
const REGISTRY = {
    notifications: () => require('./subscribers/notifications.subscriber'),
    analytics: () => require('./subscribers/analytics.subscriber'),
    audit: () => require('./subscribers/audit.subscriber'),
};

async function main() {
    const requested = process.argv.slice(2);
    const names = requested.length ? requested : Object.keys(REGISTRY);

    for (const name of names) {
        if (!REGISTRY[name]) {
            console.error(`Unknown subscriber "${name}". Available: ${Object.keys(REGISTRY).join(', ')}`);
            process.exit(1);
        }
    }

    await connectDB();

    const subscribers = names.map((name) => createSubscriber(REGISTRY[name]()));
    await Promise.all(subscribers.map((s) => s.start()));
    console.log(`Subscribers running: ${names.join(', ')}`);

    const shutdown = async () => {
        console.log('Shutting down subscribers...');
        await Promise.all(subscribers.map((s) => s.stop()));
        await Promise.all([notificationQueue.close(), auctionCloseQueue.close()]);
        await mongoose.disconnect();
        producerConnection.disconnect();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

main();