// Only knows about HTTP. Translates service errors into responses.
const bidService = require('../../service/bid.service');

async function createBid(req, res, next) {
    try {
        const { auctionId, amount } = req.body;
        const auction = await bidService.placeBid(auctionId, amount, req.user.id);
        res.json({ success: true, auction });
    } catch (err) {
        next(err); // goes to centralized error handler
    }
}

module.exports = { createBid };