const Redis = require('ioredis');

const url = process.env.REDIS_URL || 'redis://localhost:6379';

// API process: fail FAST if Redis is down. Without this, queue.add() would hang
// and freeze the HTTP request (the default behavior buffers commands offline).
const producerConnection = new Redis(url, { enableOfflineQueue: false });
producerConnection.on('error', (err) => console.error('Redis (producer) error:', err.message));

// Workers use blocking commands and MUST set maxRetriesPerRequest: null
const createWorkerConnection = () => {
    const conn = new Redis(url, { maxRetriesPerRequest: null });
    conn.on('error', (err) => console.error('Redis (worker) error:', err.message));
    return conn;
};

module.exports = { producerConnection, createWorkerConnection };