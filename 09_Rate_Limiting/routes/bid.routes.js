const router = require('express').Router();
const { createBid } = require('../controller/bid.controller');
const { bidLimiter } = require('../middleware/rateLimiter');

router.post('/bids', bidLimiter, createBid);

module.exports = router;