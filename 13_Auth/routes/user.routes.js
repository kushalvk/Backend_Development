const router = require('express').Router();
const controller = require('../controller/user.controller');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { can, selfOrCan } = require('../middleware/authorize');
const { idParamSchema, updateRoleSchema } = require('../validators/user.validator');

// Every route below requires a valid access token
router.use(authenticate);

// moderator + admin
router.get('/', can('users:read'), controller.list);

// the user themselves, OR anyone with users:read
router.get('/:id', validate(idParamSchema, 'params'), selfOrCan('users:read'), controller.getOne);

// admin only
router.patch(
    '/:id/role',
    validate(idParamSchema, 'params'),
    can('users:update-role'),
    validate(updateRoleSchema),
    controller.changeRole
);
router.delete('/:id', validate(idParamSchema, 'params'), can('users:delete'), controller.remove);

module.exports = router;