const AppError = require('../utils/AppError');
const auctionRepo = require('../repository/auction.repository');

async function placeBid(auctionId, amount, userId) {
    const auction = await auctionRepo.findById(auctionId);
    if (!auction) throw new AppError('Auction not found', 404);
    if (auction.status !== 'live') throw new AppError('Auction not active', 400);
    if (amount <= auction.currentBid) throw new AppError('Bid too low', 400);

    return auctionRepo.updateBid(auctionId, amount, userId);
}

module.exports = { placeBid };