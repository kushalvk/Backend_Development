const Auction = require('../models/auction.model');

module.exports = {
    create: (data) => Auction.create(data),

    findById: (id) => Auction.findById(id),

    // ATOMIC conditional update: succeeds only if the auction is still live,
    // not expired, and the new amount beats the current bid, all in one DB op.
    // findOneAndUpdate returns the document as it was BEFORE the update by
    // default, so the caller learns who the previous (now outbid) bidder was.
    placeBidAtomic: (id, amount, userId) =>
        Auction.findOneAndUpdate(
            { _id: id, status: 'live', endsAt: { $gt: new Date() }, currentBid: { $lt: amount } },
            { currentBid: amount, currentBidder: userId }
        ),

    // Idempotent close: running it twice is a harmless no-op the second time.
    closeAuction: async (id) => {
        const sold = await Auction.findOneAndUpdate(
            { _id: id, status: 'live', currentBidder: { $ne: null } },
            { status: 'sold' },
            { new: true }
        );
        if (sold) return sold;

        return Auction.findOneAndUpdate(
            { _id: id, status: 'live', currentBidder: null },
            { status: 'unsold' },
            { new: true }
        );
    },

    findExpiredLive: () =>
        Auction.find({ status: 'live', endsAt: { $lte: new Date() } })
            .select('_id')
            .limit(100)
            .lean(),
};