const pool = require('../db/pool');

module.exports = {
    findById: async (id) => {
        const { rows } = await pool.query('SELECT * FROM auctions WHERE id = $1', [id]);
        return rows[0] || null;
    },

    // The critical difference from Mongo: "check currentBid, then update it"
    // is TWO separate statements here — without a transaction + row lock,
    // two simultaneous bids could both read the old currentBid and both
    // "win", corrupting the auction state. A transaction with FOR UPDATE
    // prevents that.
    updateBidWithTransaction: async (auctionId, amount, userId) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // FOR UPDATE locks this row until COMMIT/ROLLBACK — any other
            // transaction trying to read this row with FOR UPDATE blocks
            // until this one finishes. This is what makes the check-then-write
            // safe under concurrent bids.
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
            return updatedRows[0];
        } catch (err) {
            await client.query('ROLLBACK'); // undo everything if any step failed
            throw err;
        } finally {
            client.release(); // always return the connection to the pool
        }
    },

    // SQL equivalent of the $group aggregation
    getRoomStats: async (auctionRoomId) => {
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
        return rows;
    },

    // SQL equivalent of the $sort + $limit leaderboard pipeline
    getTopBids: async (auctionRoomId, limit) => {
        const { rows } = await pool.query(
            `SELECT player_name AS "playerName", current_bid AS "currentBid", status
             FROM auctions
             WHERE auction_room_id = $1 AND status IN ('live', 'sold')
             ORDER BY current_bid DESC
             LIMIT $2`,
            [auctionRoomId, limit]
        );
        return rows;
    },
};