const Auction = require('../models/auction.model');

module.exports = {
    findById: (id) => Auction.findById(id),

    findAll: (auctionRoomId) => Auction.find({ auctionRoom: auctionRoomId }),

    updateBid: (id, amount, userId) =>
        Auction.findByIdAndUpdate(
            id,
            { currentBid: amount, currentBidder: userId },
            { new: true }
        ),

    getRoomStats: (auctionRoomId) =>
        Auction.aggregate([
            { $match: { auctionRoom: auctionRoomId } },
            {
                $group: {
                    _id: '$auctionRoom',
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
                    auctionRoom: '$_id',
                    totalAuctions: 1,
                    liveCount: 1,
                    soldCount: 1,
                    averageBid: { $round: ['$averageBid', 2] },
                    highestBid: 1,
                },
            },
        ]),

    getTopBids: (auctionRoomId, limit = 5) =>
        Auction.aggregate([
            { $match: { auctionRoom: auctionRoomId, status: { $in: ['live', 'sold'] } } },
            { $sort: { currentBid: -1 } },
            { $limit: limit },
            { $project: { _id: 0, playerName: 1, currentBid: 1, status: 1 } },
        ]),
};