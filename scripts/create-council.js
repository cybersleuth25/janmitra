const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
require('dotenv').config();

const createCouncil = async () => {
    try {
        // 1. Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/janmitra');
        console.log('Connected to MongoDB...');

        // 2. Council User Details
        const councilData = {
            username: 'council',
            email: 'council@janmitra.com',
            password: 'council123', // Default password
            role: 'council',
            full_name: 'Municipal Council Staff',
            phone: '9876543210'
        };

        // 3. Check if exists
        const existing = await User.findOne({ username: councilData.username });
        if (existing) {
            console.log('Council user already exists!');
            process.exit(0);
        }

        // 4. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(councilData.password, salt);

        // 5. Create User
        const newUser = new User({
            ...councilData,
            password_hash: hashedPassword
        });

        await newUser.save();
        console.log('✅ Success! Council user created.');
        console.log(`Username: ${councilData.username}`);
        console.log(`Password: ${councilData.password}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
    }
};

createCouncil();