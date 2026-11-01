const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema(
    {
        playerName: { type: String, required: true, trim: true },
        basePrice: { type: Number, required: true, min: 0 },
        currentBid: { type: Number, default: 0, min: 0 },
        currentBidder: { type: mongoose.Schema.Types.ObjectId, default: null },
        status: { type: String, enum: ['upcoming', 'live', 'sold', 'unsold'], default: 'upcoming' },
        auctionRoom: { type: mongoose.Schema.Types.ObjectId, required: true },
        endsAt: { type: Date, required: true },
    },
    { timestamps: true }
);

auctionSchema.index({ auctionRoom: 1, status: 1 });

module.exports = mongoose.model('Auction', auctionSchema);