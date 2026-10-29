const userService = require('../service/user.service');
const catchAsync = require('../utils/catchAsync');

const list = catchAsync(async (req, res) => {
    const result = await userService.listUsers(req.query.page, req.query.limit);
    res.json({ success: true, ...result });
});

const getOne = catchAsync(async (req, res) => {
    const user = await userService.getUser(req.params.id);
    res.json({ success: true, user });
});

const changeRole = catchAsync(async (req, res) => {
    const user = await userService.changeRole(req.user.id, req.params.id, req.body.role);
    res.json({ success: true, user });
});

const remove = catchAsync(async (req, res) => {
    await userService.deleteUser(req.user.id, req.params.id);
    res.json({ success: true, message: 'User deleted' });
});

module.exports = { list, getOne, changeRole, remove };