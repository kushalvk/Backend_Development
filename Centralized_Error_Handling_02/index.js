const express = require("express");
const cors = require("cors");
const bidRoutes = require('./routes/bid.routes');
const errorHandler = require('./middleware/errorHandler');
const AppError = require("./utils/AppError");

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api', bidRoutes);

// 404 handler — for routes that don't exist at all
app.use((req, res, next) => {
    next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Error handler must be registered LAST — Express identifies it
// by having 4 parameters (err, req, res, next)
app.use(errorHandler);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});