const router = require('express').Router();
const { createBid } = require('../controller/bid.controller');
const validate = require('../middleware/validate');
const { placeBidSchema } = require('../validators/bid.validator');

router.post('/bids', validate(placeBidSchema), createBid);

module.exports = router;