require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const { notificationQueue, auctionCloseQueue } = require('./queues');

const app = express();
app.use(express.json({ limit: '10kb' }));

app.use('/api', routes);
app.use((req, res, next) => next(new AppError(`Route ${req.originalUrl} not found`, 404)));
app.use(errorHandler);

connectDB().then(() => {
    const server = app.listen(process.env.PORT, () => {
        console.log(`API running on port ${process.env.PORT}`);
    });

    const shutdown = async () => {
        server.close();
        await Promise.all([notificationQueue.close(), auctionCloseQueue.close()]);
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
});