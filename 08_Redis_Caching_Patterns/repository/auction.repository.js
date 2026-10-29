const pool = require('../db/pool');
const redis = require('../db/redis');

const STATS_TTL_SECONDS = 30;      // stats can be 30s stale — acceptable for a dashboard
const LEADERBOARD_TTL_SECONDS = 15; // leaderboard feels more "live", shorter TTL

module.exports = {
    findById: async (id) => {
        const { rows } = await pool.query('SELECT * FROM auctions WHERE id = $1', [id]);
        return rows[0] || null;
    },

    updateBidWithTransaction: async (auctionId, amount, userId) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const { rows } = await client.query(
                'SELECT * FROM auctions WHERE id = $1 FOR UPDATE',
                [auctionId]
            );
            const auction = rows[0];

            if (!auction) {
                throw Object.assign(new Error('Auction not found'), { statusCode: 404 });
            }
            if (auction.status !== 'live') {
                throw Object.assign(new Error('Auction not active'), { statusCode: 400 });
            }
            if (Number(amount) <= Number(auction.current_bid)) {
                throw Object.assign(new Error('Bid too low'), { statusCode: 400 });
            }

            const { rows: updatedRows } = await client.query(
                `UPDATE auctions
                 SET current_bid = $1, current_bidder_id = $2, updated_at = NOW()
                 WHERE id = $3
                 RETURNING *`,
                [amount, userId, auctionId]
            );

            await client.query('COMMIT');

            // Invalidate: this bid just changed the room's stats and leaderboard,
            // so cached copies are now stale. Delete them rather than trying
            // to patch them — simpler and safer than in-place cache updates.
            const roomId = auction.auction_room_id;
            await redis.del(`room:${roomId}:stats`);
            await redis.del(`room:${roomId}:leaderboard`);

            return updatedRows[0];
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    // Cache-aside wrapper around the stats query
    getRoomStats: async (auctionRoomId) => {
        const cacheKey = `room:${auctionRoomId}:stats`;

        const cached = await redis.get(cacheKey);
        if (cached) {
            return [JSON.parse(cached)]; // keep same array shape as the DB query returned
        }

        const { rows } = await pool.query(
            `SELECT
                auction_room_id AS "auctionRoom",
                COUNT(*) AS "totalAuctions",
                COUNT(*) FILTER (WHERE status = 'live') AS "liveCount",
                COUNT(*) FILTER (WHERE status = 'sold') AS "soldCount",
                ROUND(AVG(current_bid), 2) AS "averageBid",
                MAX(current_bid) AS "highestBid"
             FROM auctions
             WHERE auction_room_id = $1
             GROUP BY auction_room_id`,
            [auctionRoomId]
        );

        if (rows[0]) {
            // EX sets the TTL — after 30s Redis auto-evicts this key,
            // guaranteeing staleness never exceeds that window even if
            // invalidation is somehow missed
            await redis.set(cacheKey, JSON.stringify(rows[0]), 'EX', STATS_TTL_SECONDS);
        }

        return rows;
    },

    // Cache-aside wrapper around the leaderboard query
    getTopBids: async (auctionRoomId, limit) => {
        const cacheKey = `room:${auctionRoomId}:leaderboard`;

        const cached = await redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        const { rows } = await pool.query(
            `SELECT player_name AS "playerName", current_bid AS "currentBid", status
             FROM auctions
             WHERE auction_room_id = $1 AND status IN ('live', 'sold')
             ORDER BY current_bid DESC
             LIMIT $2`,
            [auctionRoomId, limit]
        );

        await redis.set(cacheKey, JSON.stringify(rows), 'EX', LEADERBOARD_TTL_SECONDS);
        return rows;
    },
};