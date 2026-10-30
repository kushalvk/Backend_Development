const auditRepo = require('../repository/audit.repository');

// '*' = receives EVERY event type, including ones invented later
module.exports = {
    group: 'audit',
    startId: '0',
    handlers: {
        '*': async (event, { streamId }) => {
            await auditRepo.record(event, streamId);
            console.log(`[audit] ${event.type} (${event.id})`);
        },
    },
};