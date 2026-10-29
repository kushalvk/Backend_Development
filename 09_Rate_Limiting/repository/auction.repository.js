const Auction = require('../models/auction.model');
const redis = require('../config/redis');

const STATS_TTL_SECONDS = 30;
const LEADERBOARD_TTL_SECONDS = 15;

module.exports = {
    findById: (id) => Auction.findById(id),

    updateBid: async (id, amount, userId) => {
        const updated = await Auction.findByIdAndUpdate(
            id,
            { currentBid: amount, currentBidder: userId },
            { new: true }
        );
        if (updated) {
            await redis.del(`room:${updated.auctionRoom}:stats`);
            await redis.del(`room:${updated.auctionRoom}:leaderboard`);
        }
        return updated;
    },

    getRoomStats: async (auctionRoomId) => {
        const cacheKey = `room:${auctionRoomId}:stats`;
        const cached = await redis.get(cacheKey);
        if (cached) return [JSON.parse(cached)];

        const result = await Auction.aggregate([
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
        ]);

        if (result[0]) {
            await redis.set(cacheKey, JSON.stringify(result[0]), 'EX', STATS_TTL_SECONDS);
        }
        return result;
    },

    getTopBids: async (auctionRoomId, limit = 5) => {
        const cacheKey = `room:${auctionRoomId}:leaderboard`;
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);

        const result = await Auction.aggregate([
            { $match: { auctionRoom: auctionRoomId, status: { $in: ['live', 'sold'] } } },
            { $sort: { currentBid: -1 } },
            { $limit: limit },
            { $project: { _id: 0, playerName: 1, currentBid: 1, status: 1 } },
        ]);

        await redis.set(cacheKey, JSON.stringify(result), 'EX', LEADERBOARD_TTL_SECONDS);
        return result;
    },
};