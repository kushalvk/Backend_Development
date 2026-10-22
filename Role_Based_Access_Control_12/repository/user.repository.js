const User = require('../models/user.model');

module.exports = {
    findById: (id) => User.findById(id),
    findByEmail: (email) => User.findOne({ email }),
    findByEmailWithPassword: (email) => User.findOne({ email }).select('+password'),
    create: (data) => User.create(data),

    // new for RBAC
    findAll: (skip, limit) => User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    count: () => User.countDocuments(),
    updateRole: (id, role) =>
        User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true }),
    deleteById: (id) => User.findByIdAndDelete(id),
};