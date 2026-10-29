const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema(
    {
        playerName: { type: String, required: true, trim: true },
        basePrice: { type: Number, required: true, min: 0 },
        currentBid: { type: Number, default: 0, min: 0 },
        currentBidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        status: { type: String, enum: ['upcoming', 'live', 'sold', 'unsold'], default: 'live' },
        endsAt: { type: Date, required: true },
    },
    { timestamps: true }
);

// Serves the sweeper query: "live auctions that have already expired"
auctionSchema.index({ status: 1, endsAt: 1 });

module.exports = mongoose.model('Auction', auctionSchema);