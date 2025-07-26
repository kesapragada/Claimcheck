//CLAIMCHECK/backend/config/db.js
const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  let attempts = 5;
  while (attempts > 0) {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      logger.info(`MongoDB Connected: ${conn.connection.host}`);
      return; // Success, exit the function.
    } catch (error) {
      logger.warn(`MongoDB connection attempt failed: ${error.message}. Retrying in 5 seconds... (${attempts - 1} attempts left)`);
      attempts--;
      await new Promise(res => setTimeout(res, 5000));
    }
  }

  logger.error('Could not connect to MongoDB after multiple attempts. Exiting process.');
  process.exit(1);
};

module.exports = connectDB;