const router = require('express').Router();
const auction = require('../controller/auction.controller');
const bid = require('../controller/bid.controller');
const queue = require('../controller/queue.controller');
const analytics = require('../controller/analytics.controller');
const events = require('../controller/events.controller');

// write side
router.post('/auctions', auction.create);
router.get('/auctions/:id', auction.getOne);
router.post('/bids', bid.create);

// read side (projections built from events)
router.get('/auctions/:id/history', analytics.history);
router.get('/auctions/:id/analytics', analytics.auctionStats);
router.get('/analytics/top-bidders', analytics.topBidders);

// inspection (put RBAC in front of these in a real app)
router.get('/queues/stats', queue.stats);
router.get('/queues/scheduled', queue.scheduled);
router.get('/queues/failed', queue.failed);
router.post('/queues/failed/:id/retry', queue.retryFailed);

router.get('/events/stream', events.stream);
router.get('/events/groups', events.groups);
router.get('/events/dlq', events.dlq);
router.post('/events/dlq/:id/replay', events.replay);

module.exports = router;