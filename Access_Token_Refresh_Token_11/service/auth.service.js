const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const userRepo = require('../repository/user.repository');
const refreshRepo = require('../repository/refreshToken.repository');
const AppError = require('../utils/AppError');
const {
    signAccessToken,
    generateRefreshToken,
    hashToken,
} = require('../utils/token');

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function issueTokens(user, family) {
    const accessToken = signAccessToken(user);
    const refreshToken = generateRefreshToken();

    await refreshRepo.create({
        user: user._id,
        tokenHash: hashToken(refreshToken),
        family,
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    });

    return { accessToken, refreshToken };
}

async function register({ name, email, password }) {
    const existing = await userRepo.findByEmail(email);
    if (existing) throw new AppError('Email already registered', 409);

    const hashed = await bcrypt.hash(password, 10);
    const user = await userRepo.create({ name, email, password: hashed });

    return { id: user._id, name: user.name, email: user.email, role: user.role };
}

async function login({ email, password }) {
    const user = await userRepo.findByEmailWithPassword(email);

    // Same message for "no such user" and "wrong password" so attackers
    // can't use the response to discover which emails are registered
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new AppError('Invalid email or password', 401);
    }

    // New login = new family
    const tokens = await issueTokens(user, crypto.randomUUID());

    return {
        ...tokens,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
    };
}

async function refresh(rawToken) {
    if (!rawToken) throw new AppError('Refresh token missing', 401);

    const tokenHash = hashToken(rawToken);

    // Step 1: atomically try to consume a still-valid token
    const consumed = await refreshRepo.consumeValidToken(tokenHash);

    if (!consumed) {
        // Step 2: not valid. Was it a token we've ALREADY used? That means reuse.
        const existing = await refreshRepo.findByHash(tokenHash);

        if (existing && existing.revoked) {
            // A rotated-out token is being replayed. Either the legit user or
            // an attacker holds a stolen copy, and we can't tell which.
            // Kill the whole family so both are forced to log in again.
            await refreshRepo.revokeFamily(existing.family);
            throw new AppError('Token reuse detected. Please log in again.', 401);
        }

        throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await userRepo.findById(consumed.user);
    if (!user) throw new AppError('User no longer exists', 401);

    // Step 3: rotate. Issue a fresh pair in the SAME family
    return issueTokens(user, consumed.family);
}

async function logout(rawToken) {
    if (!rawToken) return;

    const existing = await refreshRepo.findByHash(hashToken(rawToken));
    if (existing) await refreshRepo.revokeFamily(existing.family);
}

module.exports = { register, login, refresh, logout };