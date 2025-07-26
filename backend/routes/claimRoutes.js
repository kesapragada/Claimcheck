//CLAIMCHECK/backend/routes/claimRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validateClaimCreation } = require('../middleware/validationMiddleware');
const {
  createClaim,
  getClaimHistory,
  getClaimById,
  updateClaim,
} = require('../controllers/claimController');

// The single POST route to create the claim record after a successful Cloudinary upload.
// CRITICAL FIX: The `protect` middleware is now correctly and unambiguously applied.
// It will run before `validateClaimCreation` and `createClaim`, ensuring req.user exists.
router.post('/', protect, validateClaimCreation, createClaim);

// Route to get the list of all claims for the logged-in user.
router.get('/', protect, getClaimHistory);

// Routes for a specific claim resource, identified by its ID.
router.route('/:id')
  .get(protect, getClaimById)
  .put(protect, updateClaim);

module.exports = router;