const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const definition = protoLoader.loadSync(path.join(__dirname, 'auction.proto'), {
    keepCase: false, // player_name in the .proto becomes playerName in JS
    longs: String,
    enums: String,
    defaults: true,  // missing fields arrive as "", 0, [] instead of undefined
    oneofs: true,
});

// In a real setup this .proto lives in a shared repo/package that both services depend on
module.exports = grpc.loadPackageDefinition(definition).auction.v1;