require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: 'http://localhost:5173', // your React dev URL
        credentials: true,               // required so the browser sends/accepts the cookie
    })
);

app.use('/api/auth', authRoutes);

app.use((req, res, next) => next(new AppError(`Route ${req.originalUrl} not found`, 404)));
app.use(errorHandler);

connectDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server running on port ${process.env.PORT}`);
    });
});