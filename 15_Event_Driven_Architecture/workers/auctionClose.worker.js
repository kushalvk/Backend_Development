const { Worker } = require('bullmq');
const { createWorkerConnection } = require('../config/redis');
const { QUEUES } = require('../queues');
const auctionRepo = require('../repository/auction.repository');
const producers = require('../queues/producers');
const { publish } = require('../events/publisher');
const { EVENT_TYPES } = require('../events/types');

async function processClose(job) {
    const { auctionId } = job.data;

    const closed = await auctionRepo.closeAuction(auctionId); // null if already closed
    const auction = closed ?? (await auctionRepo.findById(auctionId));
    if (!auction) return { skipped: 'auction not found' };

    if (auction.status === 'sold' || auction.status === 'unsold') {
        // Plain publish (NOT publishSafe): if the event bus is down this throws,
        // BullMQ retries the whole job, and the idempotent close makes that safe.
        // The retried job acts as an outbox, so this event is never silently lost.
        // Runs even when this attempt's close was a no-op, because an earlier
        // attempt may have closed the auction and then failed right here.
        await publish(
            EVENT_TYPES.AUCTION_CLOSED,
            {
                auctionId: String(auction._id),
                playerName: auction.playerName,
                status: auction.status,
                winnerId: auction.currentBidder ? String(auction.currentBidder) : null,
                finalAmount: auction.currentBid,
            },
            { id: `closed-${auction._id}` } // deterministic: duplicates are recognisable
        );
    }

    console.log(`[auction-close] ${auction._id} -> ${auction.status}`);
    return { status: auction.status };
}

async function processSweep() {
    const expired = await auctionRepo.findExpiredLive();
    await Promise.all(expired.map((a) => producers.enqueueCloseFromSweep(a._id)));
    if (expired.length) console.log(`[sweeper] rescued ${expired.length} expired auction(s)`);
    return { found: expired.length };
}

function createAuctionCloseWorker() {
    const worker = new Worker(
        QUEUES.AUCTION_CLOSE,
        async (job) => (job.name === 'sweep' ? processSweep() : processClose(job)),
        { connection: createWorkerConnection(), concurrency: 3 }
    );

    worker.on('failed', (job, err) => {
        console.warn(`[auction-close] ${job?.name}#${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`);
    });
    worker.on('error', (err) => console.error('[auction-close] worker error:', err.message));
    return worker;
}

module.exports = createAuctionCloseWorker;