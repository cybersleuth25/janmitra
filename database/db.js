const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        // If you are running locally, the URI is usually: mongodb://localhost:27017/janmitra
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/janmitra');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;