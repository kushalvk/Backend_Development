const auctionRepo = require('../repository/auction.repository');

async function placeBid(auctionId, amount, userId) {
    // All the validation now lives inside the transaction itself,
    // since the check and the write must be atomic together.
    return auctionRepo.updateBidWithTransaction(auctionId, amount, userId);
}

module.exports = { placeBid };