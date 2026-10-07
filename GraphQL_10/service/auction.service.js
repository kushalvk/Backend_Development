const auctionRepo = require('../repository/auction.repository');

async function getAuctionById(id) {
    return auctionRepo.findById(id);
}

async function getAuctionsByRoom(auctionRoomId) {
    return auctionRepo.findAll(auctionRoomId);
}

async function getRoomStats(auctionRoomId) {
    const [stats] = await auctionRepo.getRoomStats(auctionRoomId);
    return stats || null;
}

async function getLeaderboard(auctionRoomId, limit) {
    return auctionRepo.getTopBids(auctionRoomId, limit);
}

module.exports = { getAuctionById, getAuctionsByRoom, getRoomStats, getLeaderboard };