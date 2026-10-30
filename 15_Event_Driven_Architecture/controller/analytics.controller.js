const analyticsService = require('../service/analytics.service');

exports.history = async (req, res) => {
    const history = await analyticsService.getHistory(req.params.id);
    res.json({ success: true, count: history.length, history });
};

exports.auctionStats = async (req, res) => {
    const stats = await analyticsService.getAuctionAnalytics(req.params.id);
    res.json({ success: true, stats });
};

exports.topBidders = async (req, res) => {
    const bidders = await analyticsService.getTopBidders(req.query.limit);
    res.json({ success: true, bidders });
};