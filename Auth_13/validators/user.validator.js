const { z } = require('zod');
const { ROLES } = require('../config/roles');

const idParamSchema = z.object({
    id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid user ID'),
});

const updateRoleSchema = z.object({
    role: z.enum(Object.values(ROLES), { message: 'Invalid role' }),
});

module.exports = { idParamSchema, updateRoleSchema };