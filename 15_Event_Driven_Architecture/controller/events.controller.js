const { producerConnection: redis } = require('../config/redis');
const { STREAM, DLQ_STREAM } = require('../events/types');
const { toObject } = require('../events/codec');
const { publish } = require('../events/publisher');
const AppError = require('../utils/AppError');

function safeParse(text) {
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function format(entries) {
    return entries.map(([streamId, fields]) => {
        const obj = toObject(fields);
        return { streamId, ...obj, payload: safeParse(obj.payload) };
    });
}

// Newest events first
exports.stream = async (req, res) => {
    const count = Math.min(Number(req.query.count) || 20, 100);
    const entries = await redis.xrevrange(STREAM, '+', '-', 'COUNT', count);
    res.json({ success: true, events: format(entries) });
};

// One row per subscriber group: lag = events it hasn't read yet,
// pending = delivered but not yet acked (in flight or failing)
exports.groups = async (req, res) => {
    try {
        const raw = await redis.xinfo('GROUPS', STREAM);
        res.json({ success: true, groups: raw.map(toObject) });
    } catch (err) {
        if (String(err.message).includes('no such key')) return res.json({ success: true, groups: [] });
        throw err;
    }
};

// Dead-letter stream
exports.dlq = async (req, res) => {
    const entries = await redis.xrevrange(DLQ_STREAM, '+', '-', 'COUNT', 20);
    res.json({ success: true, deadLetters: format(entries) });
};

// Re-publish a dead event after fixing the root cause. It goes to ALL groups again,
// which is safe ONLY because every consumer here is idempotent.
exports.replay = async (req, res) => {
    const { id } = req.params;
    if (!/^\d+-\d+$/.test(id)) throw new AppError('Invalid DLQ entry id', 400);

    const [entry] = await redis.xrange(DLQ_STREAM, id, id);
    if (!entry) throw new AppError('DLQ entry not found', 404);

    const raw = toObject(entry[1]);
    let payload;
    try {
        payload = JSON.parse(raw.payload);
    } catch {
        throw new AppError('Entry is malformed and cannot be replayed', 400);
    }

    await publish(raw.type, payload, { id: raw.id });
    await redis.xdel(DLQ_STREAM, id);
    res.json({ success: true, message: `Event ${raw.id} re-published` });
};