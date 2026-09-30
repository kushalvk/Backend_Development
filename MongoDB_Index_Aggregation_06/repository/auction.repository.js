// Only knows how to talk to the database. No rules, no decisions.
const Auction = require('../models/auction.model');

module.exports = {
    findById: (id) => Auction.findById(id),
    updateBid: (id, amount, userId) =>
        Auction.findByIdAndUpdate(
            id,
            { currentBid: amount, currentBidder: userId },
            { new: true }
        ),

    // Aggregation: compute room-level stats in a single DB round-trip
    // instead of pulling every document into Node and reducing in JS.
    getRoomStats: (auctionRoomId) => {
        return Auction.aggregate([
            // Stage 1: filter to this room only — uses the auctionRoom+status index
            {
                $match: { auctionRoom: auctionRoomId },
            },
            // Stage 2: group all matched docs into one summary row
            {
                $group: {
                    _id: '$auctionRoom',
                    totalAuctions: { $sum: 1 },
                    liveCount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'live'] }, 1, 0],
                        },
                    },
                    soldCount: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'sold'] }, 1, 0],
                        },
                    },
                    averageBid: { $avg: '$currentBid' },
                    highestBid: { $max: '$currentBid' },
                },
            },
            // Stage 3: reshape the output — drop Mongo's default _id naming
            {
                $project: {
                    _id: 0,
                    auctionRoom: '$_id',
                    totalAuctions: 1,
                    liveCount: 1,
                    soldCount: 1,
                    averageBid: { $round: ['$averageBid', 2] },
                    highestBid: 1,
                },
            },
        ]);
    },

    // Aggregation: top N highest bids across a room — a leaderboard query
    getTopBids: (auctionRoomId, limit = 5) => {
        return Auction.aggregate([
            { $match: { auctionRoom: auctionRoomId, status: { $in: ['live', 'sold'] } } },
            { $sort: { currentBid: -1 } },
            { $limit: limit },
            {
                $project: {
                    _id: 0,
                    playerName: 1,
                    currentBid: 1,
                    status: 1,
                },
            },
        ]);
    },
};