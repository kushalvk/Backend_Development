const { randomUUID } = require('crypto');

// Correlation id: generated here (or accepted from the caller), then forwarded to
// every downstream call so one request can be traced through all service logs.
module.exports = (req, res, next) => {
    req.id = String(req.headers['x-request-id'] || randomUUID()).slice(0, 64);
    res.setHeader('x-request-id', req.id);
    next();
};