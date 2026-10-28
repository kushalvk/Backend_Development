const userRepo = require('../repository/user.repository');
const refreshRepo = require('../repository/refreshToken.repository');
const AppError = require('../utils/AppError');

async function listUsers(page, limit) {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50); // hard cap of 50

    const [users, total] = await Promise.all([
        userRepo.findAll((safePage - 1) * safeLimit, safeLimit),
        userRepo.count(),
    ]);

    return { users, total, page: safePage, pages: Math.ceil(total / safeLimit) };
}

async function getUser(id) {
    const user = await userRepo.findById(id);
    if (!user) throw new AppError('User not found', 404);
    return user;
}

async function changeRole(actorId, targetId, role) {
    // Prevents the most common lockout: the only admin demoting themselves
    if (actorId === targetId) throw new AppError('You cannot change your own role', 400);

    const user = await userRepo.updateRole(targetId, role);
    if (!user) throw new AppError('User not found', 404);

    // The target's current access token still carries the OLD role for up to
    // 15 minutes. Revoking their refresh tokens means that once it expires,
    // they must log in again and get a token with the new role.
    await refreshRepo.revokeAllForUser(targetId);

    return user;
}

async function deleteUser(actorId, targetId) {
    if (actorId === targetId) throw new AppError('You cannot delete your own account here', 400);

    const user = await userRepo.deleteById(targetId);
    if (!user) throw new AppError('User not found', 404);

    await refreshRepo.revokeAllForUser(targetId);
}

module.exports = { listUsers, getUser, changeRole, deleteUser };