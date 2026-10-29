require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { allowedOrigins } = require('./config/origins');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const noSqlGuard = require('./middleware/noSqlGuard');
const { apiLimiter } = require('./middleware/rateLimiters');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

// Behind Render/Nginx/a load balancer, req.ip would be the proxy's IP, so every
// user would share one rate-limit bucket. Trust the first proxy hop in production.
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

// 1. Security headers first, so even error responses carry them
app.use(
    helmet({
        // This is a JSON API: it should never render or embed anything
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'none'"],
                frameAncestors: ["'none'"],
            },
        },
    })
);

// 2. CORS: controls which origins can READ responses
app.use(
    cors({
        origin: (origin, cb) => {
            // No Origin = non-browser client (Postman, curl, server-to-server)
            if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
            // `false` omits CORS headers; the browser then blocks the response.
            // The request itself still executes, which is why CORS alone
            // does NOT stop CSRF.
            cb(null, false);
        },
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
);

app.use(apiLimiter);
app.use(express.json({ limit: '10kb' })); // auth payloads are tiny
app.use(cookieParser());
app.use(noSqlGuard); // must come AFTER the body is parsed

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use((req, res, next) => next(new AppError(`Route ${req.originalUrl} not found`, 404)));
app.use(errorHandler);

connectDB().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server running on port ${process.env.PORT}`);
    });
});