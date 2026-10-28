const sanitizeHtml = require('sanitize-html');

// Allow NO tags and NO attributes: everything becomes plain text
function stripHtml(value) {
    return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
}

module.exports = { stripHtml };