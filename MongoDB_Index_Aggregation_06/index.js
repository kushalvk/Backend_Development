const express = require("express");
const cors = require("cors");
const app = express();
const bidRoutes = require('./routes/auction.routes');
const auctionRoutes = require('./routes/auction.routes');

app.use(express.json());
app.use(cors());

app.use('/api', bidRoutes);
app.use('/api', auctionRoutes);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});