const express = require('express');
const service = require('../service/auction.service');
const chaos = require('../chaos');
const { DomainError } = require('../errors');

const HTTP_STATUS = { INVALID_ARGUMENT: 400, NOT_FOUND: 404, FAILED_PRECONDITION: 409, UNAVAILABLE: 503 };

function createRestServer() {
    const app = express();
    app.use(express.json({ limit: '10kb' }));

    app.use((req, res, next) => {
        console.log(`[auction-rest] ${req.headers['x-request-id'] || '-'} ${req.method} ${req.originalUrl}`);
        next();
    });

    app.get('/health', (req, res) => res.json({ status: 'ok' }));

    app.get('/internal/auctions/:id', async (req, res) => {
        res.json({ success: true, auction: await service.getAuction(req.params.id) });
    });

    app.get('/internal/rooms/:roomId/auctions', async (req, res) => {
        res.json({ success: true, auctions: await service.listByRoom(req.params.roomId) });
    });

    app.get('/internal/rooms/:roomId/stats', async (req, res) => {
        res.json({ success: true, stats: await service.getRoomStats(req.params.roomId) });
    });

    app.post('/internal/auctions/:id/bids', async (req, res) => {
        const { userId, amount } = req.body ?? {}; // Express 5: req.body is undefined when there's no body
        const result = await service.placeBid({ auctionId: req.params.id, userId, amount });
        res.json({ success: true, ...result });
    });

    // Chaos controls (internal/admin only)
    app.get('/internal/chaos', (req, res) => res.json(chaos.get()));
    app.post('/internal/chaos', (req, res) => res.json(chaos.set(req.body ?? {})));

    app.use((err, req, res, next) => {
        if (err instanceof DomainError) {
            return res.status(HTTP_STATUS[err.code] || 500).json({ success: false, code: err.code, message: err.message });
        }
        if (err.expose) {
            return res.status(err.statusCode || 400).json({ success: false, code: 'INVALID_ARGUMENT', message: err.message });
        }
        console.error(err);
        res.status(500).json({ success: false, code: 'INTERNAL', message: 'Internal error' });
    });

    return app;
}

module.exports = { createRestServer };