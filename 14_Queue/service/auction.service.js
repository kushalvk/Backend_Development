const mongoose = require('mongoose');
const auctionRepo = require('../repository/auction.repository');
const producers = require('../queues/producers');
const AppError = require('../utils/AppError');

async function createAuction({ playerName, basePrice, durationSeconds }) {
    if (!playerName || typeof playerName !== 'string') throw new AppError('playerName is required', 400);
    if (!Number.isFinite(basePrice) || basePrice < 0) throw new AppError('basePrice must be a number >= 0', 400);
    if (!Number.isInteger(durationSeconds) || durationSeconds < 10 || durationSeconds > 86400) {
        throw new AppError('durationSeconds must be an integer between 10 and 86400', 400);
    }

    const endsAt = new Date(Date.now() + durationSeconds * 1000);
    const auction = await auctionRepo.create({
        playerName,
        basePrice,
        currentBid: basePrice,
        status: 'live',
        endsAt,
    });

    // If this enqueue fails the auction still exists, and the sweeper
    // will close it once it expires. Don't fail the request over it.
    try {
        await producers.scheduleAuctionClose(auction._id, endsAt);
    } catch (err) {
        console.error('Failed to schedule auction close (sweeper will cover):', err.message);
    }

    return auction;
}

async function getAuction(id) {
    if (!mongoose.isValidObjectId(id)) throw new AppError('Invalid auction ID', 400);
    const auction = await auctionRepo.findById(id);
    if (!auction) throw new AppError('Auction not found', 404);
    return auction;
}

module.exports = { createAuction, getAuction };