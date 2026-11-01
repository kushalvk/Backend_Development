const mongoose = require('mongoose');
const Auction = require('../models/auction.model');

module.exports = {
    findById: (id) => Auction.findById(id).lean(),

    findByRoom: (roomId) => Auction.find({ auctionRoom: roomId }).sort({ currentBid: -1 }).lean(),

    // Atomic conditional update; returns the document as it was BEFORE the update
    placeBidAtomic: (id, amount, userId) =>
        Auction.findOneAndUpdate(
            { _id: id, status: 'live', endsAt: { $gt: new Date() }, currentBid: { $lt: amount } },
            { currentBid: amount, currentBidder: userId }
        ).lean(),

    roomStats: async (roomId) => {
        const [stats] = await Auction.aggregate([
            // aggregate() doesn't cast strings to ObjectId, so cast explicitly
            { $match: { auctionRoom: new mongoose.Types.ObjectId(roomId) } },
            {
                $group: {
                    _id: null,
                    totalAuctions: { $sum: 1 },
                    liveCount: { $sum: { $cond: [{ $eq: ['$status', 'live'] }, 1, 0] } },
                    soldCount: { $sum: { $cond: [{ $eq: ['$status', 'sold'] }, 1, 0] } },
                    averageBid: { $avg: '$currentBid' },
                    highestBid: { $max: '$currentBid' },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalAuctions: 1,
                    liveCount: 1,
                    soldCount: 1,
                    averageBid: { $round: ['$averageBid', 2] },
                    highestBid: 1,
                },
            },
        ]);
        return stats || null;
    },
};