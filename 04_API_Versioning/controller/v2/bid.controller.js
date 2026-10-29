const catchAsync = require('../../utils/catchAsync');
const bidService = require('../../service/bid.service');

const createBid = catchAsync(async (req, res) => {
    const { auctionId, amount } = req.body;
    const { auction, bidHistory } = await bidService.placeBidWithHistory(
        auctionId,
        amount,
        req.user.id
    );
    res.json({ success: true, auction, bidHistory }); // new shape
});

module.exports = { createBid };