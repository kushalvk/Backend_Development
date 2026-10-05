const auctionService = require('../service/auction.service');

async function getRoomStats(req, res, next) {
    try {
        const { roomId } = req.params;
        const stats = await auctionService.getRoomStats(roomId);
        res.json({ success: true, stats });
    } catch (err) {
        next(err);
    }
}

async function getLeaderboard(req, res, next) {
    try {
        const { roomId } = req.params;
        const limit = Number(req.query.limit) || 5;
        const leaderboard = await auctionService.getLeaderboard(roomId, limit);
        res.json({ success: true, leaderboard });
    } catch (err) {
        next(err);
    }
}

module.exports = { getRoomStats, getLeaderboard };