const STREAM = 'events:auction';
const DLQ_STREAM = 'events:auction:dlq';

// Past tense on purpose: an event is a FACT, not a request
const EVENT_TYPES = {
    AUCTION_CREATED: 'auction.created',
    BID_PLACED: 'bid.placed',
    AUCTION_CLOSED: 'auction.closed',
};

module.exports = { STREAM, DLQ_STREAM, EVENT_TYPES };