const router = require('express').Router();
const controller = require('../controller/auth.controller');
const validate = require('../middleware/validate');
const csrfGuard = require('../middleware/csrfGuard');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiters');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

router.post('/register', validate(registerSchema), controller.register);
router.post('/login', authLimiter, validate(loginSchema), controller.login);

// Cookie-authenticated routes, so they get the CSRF guard
router.post('/refresh', csrfGuard, controller.refresh);
router.post('/logout', csrfGuard, controller.logout);

router.get('/me', authenticate, controller.me);

module.exports = router;