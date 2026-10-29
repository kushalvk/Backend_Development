const mongoose = require('mongoose');
const auctionRepo = require('../repository/auction.repository');
const producers = require('../queues/producers');
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

    // The real, race-proof decision happens here, atomically in MongoDB
    const before = await auctionRepo.placeBidAtomic(auctionId, amount, userId);
    if (!before) throw new AppError('Bid too low', 400); // too low, or someone outbid us a millisecond ago

    // The bid is COMMITTED. Notification is a side effect, so it's enqueued
    // (a few ms), never awaited as real work, and its failure must not undo the bid.
    if (before.currentBidder) {
        try {
            await producers.enqueueOutbidNotification({
                auctionId,
                toUserId: String(before.currentBidder),
                playerName: before.playerName,
                newAmount: amount,
            });
        } catch (err) {
            console.error('Failed to enqueue outbid notification:', err.message);
        }
    }

    return {
        id: before._id,
        playerName: before.playerName,
        currentBid: amount,
        currentBidder: userId,
        endsAt: before.endsAt,
    };
}

module.exports = { placeBid };