require('dotenv').config();
const mongoose = require('mongoose');
const { createRestServer } = require('./transport/rest');
const { startGrpc } = require('./transport/grpc');

async function main() {
    await mongoose.connect(process.env.AUCTION_MONGO_URI);
    console.log('[auction-service] MongoDB connected');

    const restServer = createRestServer().listen(process.env.AUCTION_REST_PORT, () => {
        console.log(`[auction-service] REST on :${process.env.AUCTION_REST_PORT}`);
    });
    const grpcServer = await startGrpc(process.env.AUCTION_GRPC_PORT);
    console.log(`[auction-service] gRPC on :${process.env.AUCTION_GRPC_PORT}`);

    const shutdown = () => {
        console.log('[auction-service] shutting down');
        restServer.close();
        // tryShutdown waits for open streams, so force it after 3s
        const timer = setTimeout(() => grpcServer.forceShutdown(), 3000);
        grpcServer.tryShutdown(async () => {
            clearTimeout(timer);
            await mongoose.disconnect();
            process.exit(0);
        });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});