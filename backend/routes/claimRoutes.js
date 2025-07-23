// CLAIMCHECK/backend/routes/claimRoutes.js

const express = require('express');
const router = express.Router();
const uploadMiddleware = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

// Import all controller functions cleanly from the single export object
const {
  uploadClaim,
  checkStatus,
  updateClaim,
  getClaimHistory,
} = require('../controllers/claimController');

// Define the routes
router.post('/upload', protect, uploadMiddleware, uploadClaim);
router.get('/history', protect, getClaimHistory); // Place general routes before specific ones with params
router.get('/status/:claimId', protect, checkStatus);
router.put('/:id', protect, updateClaim);

module.exports = router;