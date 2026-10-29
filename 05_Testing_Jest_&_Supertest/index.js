const express = require("express");
const cors = require('cors');
const bidRoutes = require('./routes/bid.routes');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api', bidRoutes);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});