const mongoose = require('mongoose');
const analyticsRepo = require('../repository/analytics.repository');
const AppError = require('../utils/AppError');

function assertObjectId(id) {
    if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid auction ID', 400);
}

async function getHistory(auctionId) {
    assertObjectId(auctionId);
    return analyticsRepo.findByAuction(auctionId);
}

async function getAuctionAnalytics(auctionId) {
    assertObjectId(auctionId);
    const stats = await analyticsRepo.auctionStats(auctionId);
    if (!stats) throw new AppError('No bid data yet (the read model may still be catching up)', 404);
    return stats;
}

async function getTopBidders(limit) {
    const safeLimit = Math.min(Math.max(Number(limit) || 5, 1), 50);
    return analyticsRepo.topBidders(safeLimit);
}

module.exports = { getHistory, getAuctionAnalytics, getTopBidders };