const auctionRepo = require('../repository/auction.repository');

class BidError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}

async function placeBid(auctionId, amount, userId) {
    const auction = await auctionRepo.findById(auctionId);
    if (!auction) throw new BidError('Auction not found', 404);
    if (auction.status !== 'live') throw new BidError('Auction not active');
    if (amount <= auction.currentBid) throw new BidError('Bid too low');

    return auctionRepo.updateBid(auctionId, amount, userId);
}

module.exports = { placeBid, BidError };