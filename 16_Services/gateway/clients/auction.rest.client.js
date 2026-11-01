const { ServiceError } = require('../errors');

const BASE_URL = process.env.AUCTION_REST_URL || 'http://127.0.0.1:4001';

const STATUS_TO_CODE = {
    400: 'INVALID_ARGUMENT',
    404: 'NOT_FOUND',
    409: 'FAILED_PRECONDITION',
    503: 'UNAVAILABLE',
};

async function request(method, path, { body, requestId, timeoutMs }) {
    let res;
    try {
        res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers: { 'content-type': 'application/json', 'x-request-id': requestId },
            body: body ? JSON.stringify(body) : undefined,
            // The timeout: without it, a hung service would hang the gateway too
            signal: AbortSignal.timeout(timeoutMs),
        });
    } catch (err) {
        if (err.name === 'TimeoutError' || err.name === 'AbortError') {
            throw new ServiceError('DEADLINE_EXCEEDED', `auction-service did not answer within ${timeoutMs}ms`);
        }
        throw new ServiceError('UNAVAILABLE', `auction-service unreachable (${err.cause?.code || err.message})`);
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new ServiceError(STATUS_TO_CODE[res.status] || 'INTERNAL', data.message || `HTTP ${res.status}`);
    }
    return data;
}

const enc = encodeURIComponent;

module.exports = {
    name: 'rest',

    getAuction: async (id, ctx) => (await request('GET', `/internal/auctions/${enc(id)}`, ctx)).auction,

    listAuctionsByRoom: async (roomId, ctx) =>
        (await request('GET', `/internal/rooms/${enc(roomId)}/auctions`, ctx)).auctions,

    getRoomStats: async (roomId, ctx) =>
        (await request('GET', `/internal/rooms/${enc(roomId)}/stats`, ctx)).stats,

    placeBid: async ({ auctionId, userId, amount }, ctx) => {
        const data = await request('POST', `/internal/auctions/${enc(auctionId)}/bids`, {
            ...ctx,
            body: { userId, amount },
        });
        return { auction: data.auction, previousBidderId: data.previousBidderId };
    },
};