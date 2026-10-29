const auctionService = require('../service/auction.service');
const bidService = require('../service/bid.service');

const resolvers = {
    Query: {
        auction: async (_, { id }) => {
            return auctionService.getAuctionById(id);
        },
        auctionsByRoom: async (_, { roomId }) => {
            return auctionService.getAuctionsByRoom(roomId);
        },
        roomStats: async (_, { roomId }) => {
            return auctionService.getRoomStats(roomId);
        },
        leaderboard: async (_, { roomId, limit }) => {
            return auctionService.getLeaderboard(roomId, limit || 5);
        },
    },

    Mutation: {
        placeBid: async (_, { auctionId, amount, userId }) => {
            // Errors thrown here are automatically caught by Apollo and
            // returned in the response's "errors" array — no next(err)
            // or centralized error handler needed, Apollo does this natively
            return bidService.placeBid(auctionId, amount, userId);
        },
    },
};

module.exports = resolvers;