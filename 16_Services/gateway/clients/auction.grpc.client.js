const grpc = require('@grpc/grpc-js');
const proto = require('../../proto/load');
const { ServiceError } = require('../errors');

// One long-lived channel: HTTP/2 multiplexes every call over a single connection
const client = new proto.AuctionService(
    process.env.AUCTION_GRPC_ADDR || '127.0.0.1:50051',
    grpc.credentials.createInsecure()
);

const CODE_BY_STATUS = {
    [grpc.status.INVALID_ARGUMENT]: 'INVALID_ARGUMENT',
    [grpc.status.NOT_FOUND]: 'NOT_FOUND',
    [grpc.status.FAILED_PRECONDITION]: 'FAILED_PRECONDITION',
    [grpc.status.UNAVAILABLE]: 'UNAVAILABLE',
    [grpc.status.DEADLINE_EXCEEDED]: 'DEADLINE_EXCEEDED',
};

function call(method, request, { requestId, timeoutMs }) {
    return new Promise((resolve, reject) => {
        const metadata = new grpc.Metadata(); // gRPC's equivalent of HTTP headers
        metadata.set('x-request-id', requestId);

        // A DEADLINE is an absolute point in time, enforced by the framework
        client[method](request, metadata, { deadline: Date.now() + timeoutMs }, (err, response) => {
            if (err) {
                return reject(new ServiceError(CODE_BY_STATUS[err.code] || 'INTERNAL', err.details || err.message));
            }
            resolve(response);
        });
    });
}

module.exports = {
    name: 'grpc',

    getAuction: (id, ctx) => call('GetAuction', { id }, ctx),

    listAuctionsByRoom: async (roomId, ctx) => (await call('ListAuctionsByRoom', { roomId }, ctx)).auctions,

    getRoomStats: (roomId, ctx) => call('GetRoomStats', { roomId }, ctx),

    placeBid: ({ auctionId, userId, amount }, ctx) => call('PlaceBid', { auctionId, userId, amount }, ctx),

    // gRPC-only capability: a server-streaming call
    watchAuction: (auctionId, requestId) => {
        const metadata = new grpc.Metadata();
        metadata.set('x-request-id', requestId);
        return client.WatchAuction({ auctionId }, metadata);
    },
};