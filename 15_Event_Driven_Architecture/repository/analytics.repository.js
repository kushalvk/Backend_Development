const mongoose = require('mongoose');
const BidHistory = require('../models/bidHistory.model');

// aggregate() does NOT cast strings to ObjectId (find/update do), so cast explicitly
const toObjectId = (id) => new mongoose.Types.ObjectId(id);

module.exports = {
    // Idempotent write: $setOnInsert + upsert on _id = event id.
    // Redelivered or replayed events change nothing.
    recordBid: (event) =>
        BidHistory.updateOne(
            { _id: event.id },
            {
                $setOnInsert: {
                    auctionId: event.payload.auctionId,
                    bidderId: event.payload.bidderId,
                    previousBidderId: event.payload.previousBidderId,
                    amount: event.payload.amount,
                    occurredAt: new Date(event.occurredAt),
                },
            },
            { upsert: true }
        ),

    findByAuction: (auctionId) =>
        BidHistory.find({ auctionId }).sort({ occurredAt: 1, amount: 1 }).lean(),

    auctionStats: async (auctionId) => {
        const [stats] = await BidHistory.aggregate([
            { $match: { auctionId: toObjectId(auctionId) } },
            {
                $group: {
                    _id: '$auctionId',
                    totalBids: { $sum: 1 },
                    bidders: { $addToSet: '$bidderId' },
                    highestBid: { $max: '$amount' },
                    firstBidAt: { $min: '$occurredAt' },
                    lastBidAt: { $max: '$occurredAt' },
                },
            },
            {
                $project: {
                    _id: 0,
                    auctionId: '$_id',
                    totalBids: 1,
                    uniqueBidders: { $size: '$bidders' },
                    highestBid: 1,
                    firstBidAt: 1,
                    lastBidAt: 1,
                },
            },
        ]);
        return stats || null;
    },

    topBidders: (limit) =>
        BidHistory.aggregate([
            {
                $group: {
                    _id: '$bidderId',
                    totalBids: { $sum: 1 },
                    highestBid: { $max: '$amount' },
                    auctions: { $addToSet: '$auctionId' },
                },
            },
            {
                $project: {
                    _id: 0,
                    bidderId: '$_id',
                    totalBids: 1,
                    highestBid: 1,
                    auctionsParticipated: { $size: '$auctions' },
                },
            },
            { $sort: { totalBids: -1, highestBid: -1 } },
            { $limit: limit },
        ]),
};