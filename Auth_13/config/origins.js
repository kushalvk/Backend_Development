// One source of truth for CORS and the CSRF guard.
// Must be required AFTER dotenv.config() runs in index.js.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

module.exports = { allowedOrigins };