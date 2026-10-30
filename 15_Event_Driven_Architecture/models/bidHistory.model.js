const mongoose = require('mongoose');

const bidHistorySchema = new mongoose.Schema(
    {
        // _id IS the event id. Inserting the same event twice hits the same
        // document, which is what makes this projection idempotent.
        _id: { type: String },
        auctionId: { type: mongoose.Schema.Types.ObjectId, required: true },
        bidderId: { type: mongoose.Schema.Types.ObjectId, required: true },
        previousBidderId: { type: mongoose.Schema.Types.ObjectId, default: null },
        amount: { type: Number, required: true },
        occurredAt: { type: Date, required: true },
    },
    { versionKey: false }
);

bidHistorySchema.index({ auctionId: 1, occurredAt: 1 });
bidHistorySchema.index({ bidderId: 1 });

module.exports = mongoose.model('BidHistory', bidHistorySchema); // collection: bidhistories