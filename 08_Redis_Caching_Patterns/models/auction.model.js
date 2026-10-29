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
        timestamps: true, // adds createdAt / updatedAt automatically
    }
);

// Index for fast lookups of live auctions within a room —
// this is the kind of indexing decision Stage 2 of your plan digs into
auctionSchema.index({ auctionRoom: 1, status: 1 });

module.exports = mongoose.model('Auction', auctionSchema);