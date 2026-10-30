const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        _id: { type: String }, // = event id, idempotent like the projection
        type: { type: String, required: true, index: true },
        occurredAt: { type: Date },
        streamId: { type: String },
        payload: { type: mongoose.Schema.Types.Mixed },
    },
    { versionKey: false }
);

module.exports = mongoose.model('AuditLog', auditLogSchema); // collection: auditlogs