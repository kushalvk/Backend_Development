const { z } = require('zod');

const placeBidSchema = z.object({
    auctionId: z.string().length(24, 'Invalid auction ID'), // Mongo ObjectId length
    amount: z.number().positive('Bid amount must be positive'),
});

module.exports = { placeBidSchema };