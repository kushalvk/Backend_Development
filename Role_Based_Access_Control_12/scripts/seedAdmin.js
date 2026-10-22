require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);

    const email = 'admin@example.com';
    const existing = await User.findOne({ email });

    if (existing) {
        console.log('Admin already exists');
    } else {
        await User.create({
            name: 'Admin',
            email,
            password: await bcrypt.hash('Admin@12345', 10),
            role: 'admin',
        });
        console.log('Admin created:', email);
    }

    await mongoose.disconnect();
}

seed();