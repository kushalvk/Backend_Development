const { EventEmitter } = require('events');

// In-process only. Fine for one instance; multiple instances would need
// Redis Streams/Pub-Sub fan-out (last topic) to reach every WatchAuction stream.
const bidEvents = new EventEmitter();
bidEvents.setMaxListeners(1000); // one listener per open stream

module.exports = bidEvents;