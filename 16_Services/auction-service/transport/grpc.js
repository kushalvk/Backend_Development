const grpc = require('@grpc/grpc-js');
const proto = require('../../proto/load');
const service = require('../service/auction.service');
const bidEvents = require('../events');
const { DomainError } = require('../errors');

// Same domain codes, translated to gRPC's fixed status-code set
const GRPC_STATUS = {
    INVALID_ARGUMENT: grpc.status.INVALID_ARGUMENT,
    NOT_FOUND: grpc.status.NOT_FOUND,
    FAILED_PRECONDITION: grpc.status.FAILED_PRECONDITION,
    UNAVAILABLE: grpc.status.UNAVAILABLE,
};

// Adapts an async service function to a gRPC unary handler
const unary = (name, fn) => async (call, callback) => {
    const requestId = call.metadata.get('x-request-id')[0] || '-';
    console.log(`[auction-grpc] ${requestId} ${name}`);
    try {
        callback(null, await fn(call.request));
    } catch (err) {
        if (err instanceof DomainError) {
            return callback({ code: GRPC_STATUS[err.code] ?? grpc.status.INTERNAL, details: err.message });
        }
        console.error(err);
        callback({ code: grpc.status.INTERNAL, details: 'Internal error' });
    }
};

function createGrpcServer() {
    const server = new grpc.Server();

    server.addService(proto.AuctionService.service, {
        GetAuction: unary('GetAuction', (req) => service.getAuction(req.id)),

        ListAuctionsByRoom: unary('ListAuctionsByRoom', async (req) => ({
            auctions: await service.listByRoom(req.roomId),
        })),

        GetRoomStats: unary('GetRoomStats', (req) => service.getRoomStats(req.roomId)),

        PlaceBid: unary('PlaceBid', (req) =>
            service.placeBid({ auctionId: req.auctionId, userId: req.userId, amount: req.amount })
        ),

        // Server streaming: the call stays open and we push a message per bid
        WatchAuction: (call) => {
            const { auctionId } = call.request;

            const listener = (bid) => {
                if (bid.auctionId !== auctionId) return;
                call.write({
                    auctionId: bid.auctionId,
                    amount: bid.amount,
                    bidderId: bid.bidderId,
                    occurredAt: bid.occurredAt,
                });
            };

            bidEvents.on('bid', listener);
            const cleanup = () => bidEvents.off('bid', listener); // off() is idempotent
            call.on('cancelled', cleanup);
            call.on('error', cleanup);
            call.on('close', cleanup);
            console.log(`[auction-grpc] WatchAuction opened for ${auctionId}`);
        },
    });

    return server;
}

function startGrpc(port) {
    return new Promise((resolve, reject) => {
        const server = createGrpcServer();
        server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err) => {
            if (err) return reject(err);
            resolve(server); // recent grpc-js versions start serving automatically after bind
        });
    });
}

module.exports = { startGrpc };