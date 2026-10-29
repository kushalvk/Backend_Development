const RefreshToken = require('../models/refreshToken.model');

module.exports = {
    create: (data) => RefreshToken.create(data),

    findByHash: (tokenHash) => RefreshToken.findOne({ tokenHash }),

    // ATOMIC "consume": flips revoked false -> true only if the token is
    // still valid. If two refresh requests race with the same token,
    // exactly one wins and the other gets null. Same idea as the
    // FOR UPDATE lock in the Postgres topic, done in a single Mongo op.
    consumeValidToken: (tokenHash) =>
        RefreshToken.findOneAndUpdate(
            { tokenHash, revoked: false, expiresAt: { $gt: new Date() } },
            { revoked: true },
            { new: false }
        ),

    revokeFamily: (family) =>
        RefreshToken.updateMany({ family }, { revoked: true }),

    // Kill every session for a user (role change, deletion, "log out everywhere")
    revokeAllForUser: (userId) =>
        RefreshToken.updateMany({ user: userId, revoked: false }, { revoked: true }),
};