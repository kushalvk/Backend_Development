const router = require('express').Router();
const auction = require('../controller/auction.controller');
const bid = require('../controller/bid.controller');
const queue = require('../controller/queue.controller');

router.post('/auctions', auction.create);
router.get('/auctions/:id', auction.getOne);
router.post('/bids', bid.create);

router.get('/queues/stats', queue.stats);
router.get('/queues/scheduled', queue.scheduled);
router.get('/queues/failed', queue.failed);
router.post('/queues/failed/:id/retry', queue.retryFailed);

module.exports = router;