const bidService = require('../service/bid.service');

exports.create = async (req, res) => {
    const { auctionId, amount, userId } = req.body;
    const bid = await bidService.placeBid(auctionId, amount, userId);
    res.json({ success: true, bid });
};