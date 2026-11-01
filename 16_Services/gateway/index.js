require('dotenv').config(); // must run before the clients read their env vars
const express = require('express');
const requestId = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const { auctionClient } = require('./clients');
const { ServiceError } = require('./errors');

const app = express();

app.use(requestId);
app.use(express.json({ limit: '10kb' }));

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        console.log(
            `[gateway] ${req.id} ${req.method} ${req.originalUrl} -> ${res.statusCode} ` +
            `(${Date.now() - start}ms) via ${auctionClient.name.toUpperCase()}`
        );
    });
    next();
});

app.use('/api', routes);
app.use((req, res, next) => next(new ServiceError('NOT_FOUND', `Route ${req.originalUrl} not found`)));
app.use(errorHandler);

const port = process.env.GATEWAY_PORT || 3000;
app.listen(port, () => {
    console.log(`[gateway] listening on :${port}, talking to auction-service over ${auctionClient.name.toUpperCase()}`);
});