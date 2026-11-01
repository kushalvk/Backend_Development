require('dotenv').config();
const grpcClient = require('../gateway/clients/auction.grpc.client');

const auctionId = process.argv[2] || '6710a1b2c3d4e5f678901234';
const stream = grpcClient.watchAuction(auctionId, 'watch-script');

stream.on('data', (u) => console.log(`[bid] auction ${u.auctionId}: ${u.amount} by ${u.bidderId} at ${u.occurredAt}`));
stream.on('error', (err) => console.error('stream ended:', err.details || err.message));
stream.on('end', () => console.log('stream closed by server'));

console.log(`Watching auction ${auctionId} over gRPC streaming (Ctrl+C to stop)`);