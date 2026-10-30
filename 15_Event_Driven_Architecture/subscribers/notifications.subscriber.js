// const producers = require('../queues/producers');

// '$': a brand-new notification service must NOT email people about old history
module.exports = {
    group: 'notifications',
    startId: '$',
    handlers: {
        'bid.placed': async ({ payload }) => {
            if (!payload.previousBidderId) return; // first bid, nobody was outbid

            // Events decide WHAT happened; a BullMQ job handles the slow, flaky
            // email with retries and backoff. The two patterns complement each other.
            await producers.enqueueOutbidNotification({
                auctionId: payload.auctionId,
                toUserId: payload.previousBidderId,
                playerName: payload.playerName,
                newAmount: payload.amount,
            });
            console.log(`[notifications] bid.placed -> outbid email queued for ${payload.previousBidderId}`);
        },

        'auction.closed': async ({ payload }) => {
            if (payload.status !== 'sold') return;

            await producers.enqueueWonNotification({
                auctionId: payload.auctionId,
                toUserId: payload.winnerId,
                playerName: payload.playerName,
                finalAmount: payload.finalAmount,
            });
            console.log(`[notifications] auction.closed -> won email queued for ${payload.winnerId}`);
        },
    },
};