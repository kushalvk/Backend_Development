// Redis returns stream entries as flat arrays: [field1, value1, field2, value2, ...]
function toObject(flat) {
    const obj = {};
    for (let i = 0; i < flat.length; i += 2) obj[flat[i]] = flat[i + 1];
    return obj;
}

function parseEvent(fields) {
    const raw = toObject(fields);
    return {
        id: raw.id,
        type: raw.type,
        occurredAt: raw.occurredAt,
        payload: JSON.parse(raw.payload),
    };
}

module.exports = { toObject, parseEvent };