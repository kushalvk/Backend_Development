const mongoose = require('mongoose');
const auctionRepo = require('../repository/auction.repository');
const { publishSafe } = require('../events/publisher');
const { EVENT_TYPES } = require('../events/types');
const AppError = require('../utils/AppError');

async function placeBid(auctionId, amount, userId) {
    if (!mongoose.isValidObjectId(auctionId) || !mongoose.isValidObjectId(userId)) {
        throw new AppError('Invalid auctionId or userId', 400);
    }
    if (!Number.isFinite(amount) || amount <= 0) throw new AppError('amount must be a positive number', 400);

    const auction = await auctionRepo.findById(auctionId);
    if (!auction) throw new AppError('Auction not found', 404);
    if (auction.status !== 'live' || auction.endsAt <= new Date()) {
        throw new AppError('Auction not active', 400);
    }
    if (auction.currentBidder && String(auction.currentBidder) === String(userId)) {
        throw new AppError('You already hold the highest bid', 400);
    }

    const before = await auctionRepo.placeBidAtomic(auctionId, amount, userId);
    if (!before) throw new AppError('Bid too low', 400);

    // Announce the FACT. Emails, analytics and audit are not this service's business.
    // id = auction + amount is a natural idempotency key: amounts strictly increase.
    await publishSafe(
        EVENT_TYPES.BID_PLACED,
        {
            auctionId: String(before._id),
            playerName: before.playerName,
            bidderId: String(userId),
            amount,
            previousBidderId: before.currentBidder ? String(before.currentBidder) : null,
            previousAmount: before.currentBid,
        },
        { id: `bid-${before._id}-${amount}` }
    );

    return {
        id: before._id,
        playerName: before.playerName,
        currentBid: amount,
        currentBidder: userId,
        endsAt: before.endsAt,
    };
}

module.exports = { placeBid };