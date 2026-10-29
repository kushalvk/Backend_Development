const auctionService = require('../service/auction.service');

exports.create = async (req, res) => {
    const auction = await auctionService.createAuction(req.body);
    res.status(201).json({ success: true, auction });
};

exports.getOne = async (req, res) => {
    const auction = await auctionService.getAuction(req.params.id);
    res.json({ success: true, auction });
};