const bidService = require('../../service/bid.service');
const auctionRepo = require('../../repository/auction.repository');
const AppError = require('../../utils/AppError');

// Jest will not work here this only for demo (run it with npm run test)

// Replace the real repository with a mock
jest.mock('../../repository/auction.repository');

describe('bidService.placeBid', () => {
    afterEach(() => jest.clearAllMocks());

    it('throws 404 if auction does not exist', async () => {
        auctionRepo.findById.mockResolvedValue(null);

        await expect(
            bidService.placeBid('auction123', 500, 'user1')
        ).rejects.toThrow(AppError);
    });

    it('throws 400 if auction is not live', async () => {
        auctionRepo.findById.mockResolvedValue({ status: 'sold', currentBid: 100 });

        await expect(
            bidService.placeBid('auction123', 500, 'user1')
        ).rejects.toThrow('Auction not active');
    });

    it('throws 400 if bid is not higher than currentBid', async () => {
        auctionRepo.findById.mockResolvedValue({ status: 'live', currentBid: 500 });

        await expect(
            bidService.placeBid('auction123', 400, 'user1')
        ).rejects.toThrow('Bid too low');
    });

    it('places the bid when auction is live and bid is valid', async () => {
        auctionRepo.findById.mockResolvedValue({ status: 'live', currentBid: 200 });
        auctionRepo.updateBid.mockResolvedValue({
            _id: 'auction123',
            currentBid: 500,
            currentBidder: 'user1',
        });

        const result = await bidService.placeBid('auction123', 500, 'user1');

        expect(auctionRepo.updateBid).toHaveBeenCalledWith('auction123', 500, 'user1');
        expect(result.currentBid).toBe(500);
    });
});