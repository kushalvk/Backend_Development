const router = require('express').Router();
const { auctionClient } = require('./clients');
const { resilientCall, breaker } = require('./resilience');
const { ServiceError } = require('./errors');

const TIMEOUT_MS = Number(process.env.CALL_TIMEOUT_MS || 1500);
const ctx = (req) => ({ requestId: req.id, timeoutMs: TIMEOUT_MS });
const toPublic = (a) => ({ ...a, currentBidder: a.currentBidder || null });

// 1. Single read: safe to retry (idempotent)
router.get('/auctions/:id', async (req, res) => {
    const auction = await resilientCall(() => auctionClient.getAuction(req.params.id, ctx(req)), {
        retries: 2,
        label: 'getAuction',
    });
    res.json({ success: true, auction: toPublic(auction) });
});

// 2. Write: NO automatic retries. If a call times out, the bid may or may not have
//    been committed. Retrying a non-idempotent write blindly risks doing it twice.
router.post('/bids', async (req, res) => {
    const { auctionId, userId, amount } = req.body ?? {};
    if (typeof auctionId !== 'string' || typeof userId !== 'string' || typeof amount !== 'number') {
        throw new ServiceError('INVALID_ARGUMENT', 'auctionId (string), userId (string) and amount (number) are required');
    }

    const result = await resilientCall(() => auctionClient.placeBid({ auctionId, userId, amount }, ctx(req)), {
        retries: 0,
        label: 'placeBid',
    });
    res.json({
        success: true,
        auction: toPublic(result.auction),
        previousBidderId: result.previousBidderId || null,
    });
});

// 3. Fan-out: two independent calls in PARALLEL, with graceful degradation
router.get('/rooms/:roomId/dashboard', async (req, res) => {
    const [auctionsResult, statsResult] = await Promise.allSettled([
        resilientCall(() => auctionClient.listAuctionsByRoom(req.params.roomId, ctx(req)), {
            retries: 1,
            label: 'listAuctionsByRoom',
        }),
        resilientCall(() => auctionClient.getRoomStats(req.params.roomId, ctx(req)), {
            retries: 1,
            label: 'getRoomStats',
        }),
    ]);

    // The auction list is the core of the page, so without it the request fails.
    // Stats are a nice-to-have, so without them we still answer, marked as degraded.
    if (auctionsResult.status === 'rejected') throw auctionsResult.reason;

    res.json({
        success: true,
        auctions: auctionsResult.value.map(toPublic),
        stats: statsResult.status === 'fulfilled' ? statsResult.value : null,
        degraded: statsResult.status === 'rejected',
    });
});

// 4. Visibility into the breaker
router.get('/health/downstream', (req, res) => {
    res.json({ transport: auctionClient.name, circuit: breaker.snapshot() });
});

module.exports = router;