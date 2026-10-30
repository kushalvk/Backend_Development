const AuditLog = require('../models/auditLog.model');

module.exports = {
    record: (event, streamId) =>
        AuditLog.updateOne(
            { _id: event.id },
            {
                $setOnInsert: {
                    type: event.type,
                    occurredAt: new Date(event.occurredAt),
                    streamId,
                    payload: event.payload,
                },
            },
            { upsert: true }
        ),
};