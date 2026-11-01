const clients = {
    rest: require('./auction.rest.client'),
    grpc: require('./auction.grpc.client'),
};

// `node gateway/index.js grpc` wins, then the TRANSPORT env var, then REST
const arg = process.argv[2];
const selected = arg === 'rest' || arg === 'grpc' ? arg : (process.env.TRANSPORT || 'rest').toLowerCase();

if (!clients[selected]) throw new Error(`Unknown transport "${selected}" (use rest or grpc)`);

module.exports = { auctionClient: clients[selected], clients };