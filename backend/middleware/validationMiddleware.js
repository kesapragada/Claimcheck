//CLAIMCHECK/backend/middleware/validationMiddleware.js
const { check, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

exports.validateRegistration = [
  check('name', 'Name is required').not().isEmpty().trim().escape(),
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  handleValidationErrors,
];

exports.validateLogin = [
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password cannot be empty').not().isEmpty(),
  handleValidationErrors,
];

exports.validateClaimCreation = [
  check('filename', 'Filename is required').not().isEmpty().trim().escape(),
  check('secureUrl', 'Secure URL is required').isURL(),
  check('publicId', 'Public ID is required').not().isEmpty().trim(),
  handleValidationErrors,
];