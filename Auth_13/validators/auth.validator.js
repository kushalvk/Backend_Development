const { z } = require('zod');
const { stripHtml } = require('../utils/sanitize');

const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name too long')
        .transform(stripHtml)
        // If the whole name was markup, nothing is left after stripping
        .pipe(z.string().min(2, 'Name is invalid')),
    email: z.string().trim().toLowerCase().email('Invalid email'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        // bcrypt silently ignores everything past 72 bytes
        .max(72, 'Password must be at most 72 characters'),
});

const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email('Invalid email'),
    password: z.string().min(1, 'Password is required').max(72, 'Invalid credentials'),
});

module.exports = { registerSchema, loginSchema };