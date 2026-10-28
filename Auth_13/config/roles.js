const ROLES = {
    USER: 'user',
    MODERATOR: 'moderator',
    ADMIN: 'admin',
};

// Routes check PERMISSIONS, not role names. When a new role is added,
// only this map changes and no route needs editing.
const ROLE_PERMISSIONS = {
    user: ['profile:read'],
    moderator: ['profile:read', 'users:read'],
    admin: ['profile:read', 'users:read', 'users:update-role', 'users:delete'],
};

module.exports = { ROLES, ROLE_PERMISSIONS };