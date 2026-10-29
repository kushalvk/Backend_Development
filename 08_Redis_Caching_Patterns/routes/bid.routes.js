const router = require('express').Router();
const { createBid } = require('../controller/bid.controller');
router.post('/bids', createBid);
module.exports = router;