const router = require('express').Router();
const { getRoomStats, getLeaderboard } = require('../controller/auction.controller');

router.get('/rooms/:roomId/stats', getRoomStats);
router.get('/rooms/:roomId/leaderboard', getLeaderboard);

module.exports = router;