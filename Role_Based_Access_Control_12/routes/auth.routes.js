const router = require('express').Router();
const controller = require('../controller/auth.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);

// Protected route used to test access tokens
router.get('/me', authenticate, controller.me);

module.exports = router;