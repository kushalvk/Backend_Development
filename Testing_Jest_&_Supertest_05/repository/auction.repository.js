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
};