const os = require('os');
const { createWorkerConnection } = require('../config/redis');
const { STREAM, DLQ_STREAM } = require('./types');
const { toObject, parseEvent } = require('./codec');

const BATCH = 10;
const BLOCK_MS = 2000;
const CLAIM_MIN_IDLE_MS = Number(process.env.CLAIM_MIN_IDLE_MS || 5000);
const MAX_DELIVERIES = Number(process.env.MAX_DELIVERIES || 3);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * @param group    consumer group name = the identity of this subscriber service
 * @param startId  '$' = only events published after the group is created
 *                 '0' = from the beginning of the stream (replayable projections)
 * @param handlers { 'event.type': async (event, meta) => {}, '*': fallback for all types }
 */
function createSubscriber({ group, startId = '$', handlers }) {
    const redis = createWorkerConnection(); // dedicated: XREADGROUP BLOCK ties up its connection
    const consumer = `${group}-${os.hostname()}-${process.pid}`;
    const lastError = new Map(); // streamId -> last handler error (this process only)
    let running = false;
    let loopPromise = null;

    async function ensureGroup() {
        try {
            await redis.xgroup('CREATE', STREAM, group, startId, 'MKSTREAM');
            console.log(`[${group}] consumer group created (start: ${startId})`);
        } catch (err) {
            if (!String(err.message).includes('BUSYGROUP')) throw err; // already exists = fine
        }
    }

    async function deadLetter(streamId, fields, reason, attempts) {
        const raw = toObject(fields);
        await redis.xadd(
            DLQ_STREAM, 'MAXLEN', '~', 1000, '*',
            'group', group,
            'streamId', streamId,
            'reason', String(reason).slice(0, 500),
            'attempts', String(attempts),
            'failedAt', new Date().toISOString(),
            'id', raw.id ?? '',
            'type', raw.type ?? '',
            'occurredAt', raw.occurredAt ?? '',
            'payload', raw.payload ?? ''
        );
        await redis.xack(STREAM, group, streamId); // stop retrying it
        lastError.delete(streamId);
        console.error(`[${group}] ${raw.type || 'unknown'} (${raw.id}) -> DEAD-LETTERED: ${reason}`);
    }

    async function handleEntry(streamId, fields, { claimed }) {
        // Entry was trimmed out of the stream while still pending
        if (!fields) {
            await redis.xack(STREAM, group, streamId);
            return;
        }

        // Redelivered entries: has it already burned its attempts?
        if (claimed) {
            const [pending] = await redis.xpending(STREAM, group, streamId, streamId, 1);
            const deliveries = pending ? Number(pending[3]) : 1;
            if (deliveries > MAX_DELIVERIES) {
                await deadLetter(
                    streamId, fields,
                    lastError.get(streamId) || `exceeded ${MAX_DELIVERIES} deliveries`,
                    deliveries - 1
                );
                return;
            }
        }

        let event;
        try {
            event = parseEvent(fields);
        } catch (err) {
            // Poison message: retrying can never fix malformed data
            await deadLetter(streamId, fields, `Malformed event: ${err.message}`, 0);
            return;
        }

        const handler = handlers[event.type] || handlers['*'];
        if (!handler) {
            await redis.xack(STREAM, group, streamId); // this group doesn't care about this event
            return;
        }

        try {
            await handler(event, { streamId });
            await redis.xack(STREAM, group, streamId);
            lastError.delete(streamId);
        } catch (err) {
            // NO ack: the entry stays in the pending list and is retried by XAUTOCLAIM
            lastError.set(streamId, err.message);
            console.warn(
                `[${group}] ${event.type} (${event.id}) failed: ${err.message} ` +
                `-> left pending, retry in >= ${CLAIM_MIN_IDLE_MS}ms`
            );
        }
    }

    // Steal entries that were delivered but never acked and have sat idle too long.
    // Covers BOTH a crashed sibling consumer AND our own failed handlers;
    // the idle threshold doubles as a built-in retry delay.
    async function reclaimStale() {
        const result = await redis.xautoclaim(
            STREAM, group, consumer, CLAIM_MIN_IDLE_MS, '0-0', 'COUNT', BATCH
        );
        const entries = result?.[1] ?? [];
        for (const [streamId, fields] of entries) {
            await handleEntry(streamId, fields, { claimed: true });
        }
    }

    async function loop() {
        while (running) {
            try {
                await reclaimStale();

                const res = await redis.xreadgroup(
                    'GROUP', group, consumer,
                    'COUNT', BATCH, 'BLOCK', BLOCK_MS,
                    'STREAMS', STREAM, '>'
                );
                if (!res) continue; // block timed out, nothing new

                for (const [, entries] of res) {
                    for (const [streamId, fields] of entries) {
                        await handleEntry(streamId, fields, { claimed: false });
                    }
                }
            } catch (err) {
                if (String(err.message).includes('NOGROUP')) {
                    await ensureGroup().catch(() => {}); // stream/group was deleted underneath us
                } else {
                    console.error(`[${group}] loop error: ${err.message}`);
                }
                await sleep(1000);
            }
        }
    }

    async function start() {
        await ensureGroup();
        running = true;
        loopPromise = loop();
        console.log(`[${group}] subscribed as ${consumer} to: ${Object.keys(handlers).join(', ')}`);
    }

    async function stop() {
        running = false;
        if (loopPromise) await loopPromise; // lets the in-flight batch finish (max ~BLOCK_MS)
        redis.disconnect();
    }

    return { group, start, stop };
}

module.exports = { createSubscriber };