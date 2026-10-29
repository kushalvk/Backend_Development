const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_TTL = '15m';

function signAccessToken(user) {
    return jwt.sign(
        { sub: user._id.toString(), role: user.role },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: ACCESS_TTL }
    );
}

function verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

// Refresh token = random opaque string, NOT a JWT.
// 64 random bytes -> impossible to guess, nothing to decode.
function generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
}

// Only the hash is stored in the DB. If the DB leaks, the attacker
// gets hashes they can't turn back into usable tokens.
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { signAccessToken, verifyAccessToken, generateRefreshToken, hashToken };