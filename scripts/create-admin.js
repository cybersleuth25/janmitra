const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
    try {
        // 1. Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/janmitra');
        console.log('Connected to MongoDB...');

        // 2. Check if admin already exists
        const existingAdmin = await User.findOne({ username: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists!');
            process.exit(0);
        }

        // 3. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // 4. Create the new Admin User
        const newAdmin = new User({
            username: 'admin',
            email: 'admin@janmitra.com',
            password_hash: hashedPassword,
            role: 'admin',
            full_name: 'System Administrator',
            phone: '0000000000'
        });

        await newAdmin.save();
        console.log('✅ Success! Admin user created.');
        console.log('Username: admin');
        console.log('Password: admin123');

    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        mongoose.disconnect();
    }
};

createAdmin();