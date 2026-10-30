const { randomUUID } = require('crypto');
const { producerConnection: redis } = require('../config/redis');
const { STREAM } = require('./types');

const MAXLEN = Number(process.env.STREAM_MAXLEN || 10000);

// `id` is the event's identity. Passing a DETERMINISTIC id (e.g. closed-<auctionId>)
// means a republished event is recognisable as a duplicate by every consumer.
async function publish(type, payload, { id } = {}) {
    const event = {
        id: id || randomUUID(),
        type,
        occurredAt: new Date().toISOString(),
        payload,
    };

    // MAXLEN ~ trims the stream to roughly N entries so it can't grow forever
    const streamId = await redis.xadd(
        STREAM, 'MAXLEN', '~', MAXLEN, '*',
        'id', event.id,
        'type', event.type,
        'occurredAt', event.occurredAt,
        'payload', JSON.stringify(event.payload)
    );

    return { ...event, streamId };
}

// For the request path: the business operation already committed, so a broken
// event bus must not turn a successful bid into a 500.
async function publishSafe(type, payload, opts) {
    try {
        return await publish(type, payload, opts);
    } catch (err) {
        console.error(`[events] FAILED to publish ${type}:`, err.message);
        return null;
    }
}

module.exports = { publish, publishSafe };