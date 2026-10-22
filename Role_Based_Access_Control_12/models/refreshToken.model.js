const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        tokenHash: { type: String, required: true, unique: true },
        // All tokens descended from one login share a family id.
        // Reuse detection revokes the whole family at once.
        family: { type: String, required: true, index: true },
        revoked: { type: Boolean, default: false },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

// TTL index: MongoDB auto-deletes the document once expiresAt passes
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);