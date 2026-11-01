const repo = require('../repository/auction.repository');
const chaos = require('../chaos');
const bidEvents = require('../events');
const { DomainError } = require('../errors');

// Identical shape for REST and gRPC, so both transports stay interchangeable
const toDto = (a) => ({
    id: String(a._id),
    playerName: a.playerName,
    basePrice: a.basePrice,
    currentBid: a.currentBid,
    currentBidder: a.currentBidder ? String(a.currentBidder) : '',
    status: a.status,
    auctionRoom: String(a.auctionRoom),
    endsAt: a.endsAt.toISOString(),
});

function assertObjectId(value, label) {
    if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) {
        throw new DomainError('INVALID_ARGUMENT', `Invalid ${label}`);
    }
}

async function getAuction(id) {
    await chaos.apply();
    assertObjectId(id, 'auction ID');
    const auction = await repo.findById(id);
    if (!auction) throw new DomainError('NOT_FOUND', 'Auction not found');
    return toDto(auction);
}

async function listByRoom(roomId) {
    await chaos.apply();
    assertObjectId(roomId, 'room ID');
    return (await repo.findByRoom(roomId)).map(toDto);
}

async function getRoomStats(roomId) {
    await chaos.apply();
    assertObjectId(roomId, 'room ID');
    const stats = await repo.roomStats(roomId);
    return stats || { totalAuctions: 0, liveCount: 0, soldCount: 0, averageBid: 0, highestBid: 0 };
}

async function placeBid({ auctionId, userId, amount }) {
    await chaos.apply();
    assertObjectId(auctionId, 'auction ID');
    assertObjectId(userId, 'user ID');
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
        throw new DomainError('INVALID_ARGUMENT', 'amount must be a positive number');
    }

    const auction = await repo.findById(auctionId);
    if (!auction) throw new DomainError('NOT_FOUND', 'Auction not found');
    if (auction.status !== 'live' || auction.endsAt <= new Date()) {
        throw new DomainError('FAILED_PRECONDITION', 'Auction not active');
    }
    if (auction.currentBidder && String(auction.currentBidder) === userId) {
        throw new DomainError('FAILED_PRECONDITION', 'You already hold the highest bid');
    }

    const before = await repo.placeBidAtomic(auctionId, amount, userId);
    if (!before) throw new DomainError('FAILED_PRECONDITION', 'Bid too low');

    bidEvents.emit('bid', {
        auctionId,
        amount,
        bidderId: userId,
        occurredAt: new Date().toISOString(),
    });

    return {
        auction: { ...toDto(before), currentBid: amount, currentBidder: userId },
        previousBidderId: before.currentBidder ? String(before.currentBidder) : '',
    };
}

module.exports = { getAuction, listByRoom, getRoomStats, placeBid };