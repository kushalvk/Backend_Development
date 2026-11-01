require('dotenv').config();
const mongoose = require('mongoose');
const Auction = require('../auction-service/models/auction.model');

const ROOM = '665f1a2b3c4d5e6f78901111';
const USER_A = '6710a1b2c3d4e5f678905678';
const USER_B = '6710a1b2c3d4e5f678905679';
const inOneHour = new Date(Date.now() + 60 * 60 * 1000);

const docs = [
    { _id: '6710a1b2c3d4e5f678901234', playerName: 'Virat Sharma', basePrice: 200, currentBid: 300, currentBidder: USER_A, status: 'live', auctionRoom: ROOM, endsAt: inOneHour },
    { _id: '6710a1b2c3d4e5f678901235', playerName: 'Rohit Kapoor', basePrice: 150, currentBid: 450, currentBidder: USER_B, status: 'live', auctionRoom: ROOM, endsAt: inOneHour },
    { _id: '6710a1b2c3d4e5f678901236', playerName: 'Arjun Mehta', basePrice: 100, currentBid: 100, currentBidder: null, status: 'upcoming', auctionRoom: ROOM, endsAt: inOneHour },
    { _id: '6710a1b2c3d4e5f678901237', playerName: 'Karan Verma', basePrice: 250, currentBid: 800, currentBidder: USER_B, status: 'sold', auctionRoom: ROOM, endsAt: inOneHour },
];

// Optional bulk data, so list calls return a big payload for the benchmark
const bulk = Number(process.argv[2] || 0);
for (let i = 1; i <= bulk; i++) {
    const base = 100 + (i % 50);
    docs.push({
        playerName: `Bulk Player ${i}`,
        basePrice: base,
        currentBid: base + (i % 7) * 10,
        currentBidder: null,
        status: 'live',
        auctionRoom: ROOM,
        endsAt: inOneHour,
    });
}

(async () => {
    await mongoose.connect(process.env.AUCTION_MONGO_URI);
    await Auction.deleteMany({});
    await Auction.insertMany(docs);
    console.log(`Seeded ${docs.length} auctions in room ${ROOM}`);
    await mongoose.disconnect();
})();