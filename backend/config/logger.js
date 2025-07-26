//CLAIMCHECK/backend/config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    // In production, you would add transports to write to files or cloud logging services.
    // For this project, logging to the console is sufficient to demonstrate the pattern.
  ],
});

// If we're not in production, then log to the simple `console` format.
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

module.exports = logger;