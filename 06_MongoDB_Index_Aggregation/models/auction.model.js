const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema(
    {
        playerName: {
            type: String,
            required: true,
            trim: true,
        },
        basePrice: {
            type: Number,
            required: true,
            min: 0,
        },
        currentBid: {
            type: Number,
            default: 0,
            min: 0,
        },
        currentBidder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        status: {
            type: String,
            enum: ['upcoming', 'live', 'sold', 'unsold'],
            default: 'upcoming',
        },
        auctionRoom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AuctionRoom',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index: supports "find live auctions in this room" AND
// is the same index the $match stage in getRoomStats() below will use —
// compound indexes serve exact-match queries on any PREFIX of their fields,
// so this also speeds up "find all auctions in this room" alone.
auctionSchema.index({ auctionRoom: 1, status: 1 });

// Text index: supports searching auctions by player name (e.g. a search bar)
auctionSchema.index({ playerName: 'text' });

// Single-field index: supports sorting/filtering by currentBid,
// e.g. "highest bids across all rooms" leaderboard queries
auctionSchema.index({ currentBid: -1 });

module.exports = mongoose.model('Auction', auctionSchema);