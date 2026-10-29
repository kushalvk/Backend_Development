const authService = require('../service/auth.service');
const catchAsync = require('../utils/catchAsync');

const REFRESH_COOKIE = 'refreshToken';

const cookieOptions = {
    httpOnly: true,                                  // JS can't read it, so XSS can't steal it
    secure: process.env.NODE_ENV === 'production',   // HTTPS only in prod
    sameSite: 'strict',                              // blocks CSRF-style cross-site sends
    path: '/api/auth',                               // browser only sends it to auth routes
    maxAge: 7 * 24 * 60 * 60 * 1000,
};

const register = catchAsync(async (req, res) => {
    const user = await authService.register(req.body);
    res.status(201).json({ success: true, user });
});

const login = catchAsync(async (req, res) => {
    const { accessToken, refreshToken, user } = await authService.login(req.body);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions);
    res.json({ success: true, accessToken, user });
});

const refresh = catchAsync(async (req, res) => {
    const { accessToken, refreshToken } = await authService.refresh(req.cookies[REFRESH_COOKIE]);
    res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions); // rotated cookie replaces the old one
    res.json({ success: true, accessToken });
});

const logout = catchAsync(async (req, res) => {
    await authService.logout(req.cookies[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, { path: cookieOptions.path });
    res.json({ success: true, message: 'Logged out' });
});

const me = catchAsync(async (req, res) => {
    res.json({ success: true, user: req.user });
});

module.exports = { register, login, refresh, logout, me };