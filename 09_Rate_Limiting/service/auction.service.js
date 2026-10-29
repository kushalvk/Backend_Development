const auctionRepo = require('../repository/auction.repository');

class AuctionError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}

async function getRoomStats(auctionRoomId) {
    const [stats] = await auctionRepo.getRoomStats(auctionRoomId);
    if (!stats) throw new AuctionError('No auctions found for this room', 404);
    return stats;
}

async function getLeaderboard(auctionRoomId, limit) {
    return auctionRepo.getTopBids(auctionRoomId, limit);
}

module.exports = { getRoomStats, getLeaderboard, AuctionError };