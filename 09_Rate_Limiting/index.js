const express = require("express");
const cors = require("cors");
const app = express();
const bidRoutes = require('./routes/bid.routes');
const auctionRoutes = require('./routes/auction.routes');
const { generalLimiter } = require('./middleware/rateLimiter');

app.use(express.json());
app.use(cors());
app.use(generalLimiter);

app.use('/api', bidRoutes);
app.use('/api', auctionRoutes);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});