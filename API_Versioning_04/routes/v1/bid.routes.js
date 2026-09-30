const router = require('express').Router();
const { createBid } = require('../../controller/v1/bid.controller');
router.post('/bids', createBid);
module.exports = router;