const express = require("express");
const bidRoutesV1 = require('./routes/v1/bid.routes');
const bidRoutesV2 = require('./routes/v2/bid.routes');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/v1', bidRoutesV1);
app.use('/api/v2', bidRoutesV2);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});