const { Worker } = require('bullmq');
const { createWorkerConnection } = require('../config/redis');
const { QUEUES } = require('../queues');
const auctionRepo = require('../repository/auction.repository');
const producers = require('../queues/producers');

// Every step is idempotent, so the job is safe to run twice (BullMQ is
// at-least-once: a worker crash mid-job means the job runs again).
async function processClose(job) {
    const { auctionId } = job.data;

    const closed = await auctionRepo.closeAuction(auctionId); // null if already closed
    const auction = closed ?? (await auctionRepo.findById(auctionId));
    if (!auction) return { skipped: 'auction not found' };

    // Runs even when the close was a no-op: if an earlier attempt closed the
    // auction and then failed at this line, the retry still sends the
    // notification. The jobId (won-<auctionId>) prevents duplicates.
    if (auction.status === 'sold') {
        await producers.enqueueWonNotification({
            auctionId: auction._id,
            toUserId: String(auction.currentBidder),
            playerName: auction.playerName,
            finalAmount: auction.currentBid,
        });
    }

    console.log(`[auction-close] ${auction._id} -> ${auction.status}`);
    return { status: auction.status };
}

// Safety net: finds expired auctions whose delayed close job never ran
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