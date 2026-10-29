const catchAsync = require('../utils/catchAsync');
const bidService = require('../service/bid.service');

const createBid = catchAsync(async (req, res) => {
    const { auctionId, amount } = req.body;
    const auction = await bidService.placeBid(auctionId, amount, req.user.id);
    res.json({ success: true, auction });
});

module.exports = { createBid };