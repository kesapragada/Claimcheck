// CLAIMCHECK/backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (token && token.startsWith('Bearer ')) {
      token = token.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ msg: 'User not found' });
      }

      req.user = user;
      next();
    } else {
      return res.status(401).json({ msg: 'No token provided' });
    }
  } catch (err) {
    console.error('Auth error:', err);
    res.status(401).json({ msg: 'Not authorized' });
  }
};

module.exports = { protect };
