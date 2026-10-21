const User = require('../models/user.model');

module.exports = {
    findById: (id) => User.findById(id),
    findByEmail: (email) => User.findOne({ email }),
    findByEmailWithPassword: (email) => User.findOne({ email }).select('+password'),
    create: (data) => User.create(data),
};