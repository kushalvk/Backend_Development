const { notificationQueue, auctionCloseQueue } = require('./index');

// jobId makes enqueueing IDEMPOTENT: adding a job whose id already exists is
// ignored. Ids can't contain ":", so we join parts with "-".

function enqueueOutbidNotification({ auctionId, toUserId, playerName, newAmount }) {
    return notificationQueue.add(
        'outbid',
        { auctionId: String(auctionId), toUserId, playerName, newAmount },
        { jobId: `outbid-${auctionId}-${toUserId}-${newAmount}` }
    );
}

function enqueueWonNotification({ auctionId, toUserId, playerName, finalAmount }) {
    return notificationQueue.add(
        'won',
        { auctionId: String(auctionId), toUserId, playerName, finalAmount },
        { jobId: `won-${auctionId}` }
    );
}

// DELAYED job: sits in Redis and becomes runnable at endsAt
function scheduleAuctionClose(auctionId, endsAt) {
    const delay = Math.max(new Date(endsAt).getTime() - Date.now(), 0);
    return auctionCloseQueue.add(
        'close',
        { auctionId: String(auctionId) },
        { delay, jobId: `close-${auctionId}` }
    );
}

// Used by the sweeper. The id includes a 1-minute bucket: deterministic enough to
// dedupe within a tick, but not permanent, so a previously FAILED close job
// (which would keep its id) can't block the rescue forever.
function enqueueCloseFromSweep(auctionId) {
    const bucket = Math.floor(Date.now() / 60000);
    return auctionCloseQueue.add(
        'close',
        { auctionId: String(auctionId) },
        { jobId: `sweepclose-${auctionId}-${bucket}` }
    );
}

module.exports = {
    enqueueOutbidNotification,
    enqueueWonNotification,
    scheduleAuctionClose,
    enqueueCloseFromSweep,
};