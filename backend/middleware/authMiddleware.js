//CLAIMCHECK/backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const IORedis = require('ioredis');
const logger = require('../config/logger');

// Create a dedicated Redis client for user caching to avoid conflicts.
const redisCache = new IORedis(process.env.REDIS_URL);

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const cacheKey = `user:${decoded.id}`;

      // 1. Check the Redis cache first for the user object.
      const cachedUser = await redisCache.get(cacheKey);

      if (cachedUser) {
        // If the user is found in the cache, parse and attach it to the request.
        // This avoids a database hit entirely for subsequent requests.
        req.user = JSON.parse(cachedUser);
        return next();
      }

      // 2. If the user is not in the cache, perform the database lookup.
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ msg: 'Not authorized, user not found' });
      }

      // 3. Store the freshly fetched user object in the cache with a Time-To-Live (TTL).
      // A 5-minute TTL (300 seconds) is a good balance between performance and data freshness.
      await redisCache.setex(cacheKey, 300, JSON.stringify(user.toObject()));


      req.user = user;
      next();
    } catch (error) {
      logger.error('Token verification failed', { error: error.message });
      res.status(401).json({ msg: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ msg: 'Not authorized, no token' });
  }
};