const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../index');
const Auction = require('../../models/auction.model');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Auction.deleteMany({});
});

describe('POST /api/v1/bids', () => {
    it('returns 400 for malformed request body', async () => {
        const res = await request(app)
            .post('/api/v1/bids')
            .send({ auctionId: 'too-short', amount: -5 });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('returns 404 if auction does not exist', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();

        const res = await request(app)
            .post('/api/v1/bids')
            .send({ auctionId: fakeId, amount: 500 });

        expect(res.status).toBe(404);
    });

    it('places a bid successfully on a live auction', async () => {
        const auction = await Auction.create({
            playerName: 'Test Player',
            basePrice: 100,
            currentBid: 100,
            status: 'live',
            auctionRoom: new mongoose.Types.ObjectId(),
        });

        const res = await request(app)
            .post('/api/v1/bids')
            .send({ auctionId: auction._id.toString(), amount: 500 });

        expect(res.status).toBe(200);
        expect(res.body.auction.currentBid).toBe(500);
    });
});