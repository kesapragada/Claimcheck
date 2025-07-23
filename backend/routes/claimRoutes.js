// CLAIMCHECK/backend/routes/claimRoutes.js
const express = require('express');
const router = express.Router();

const uploadMiddleware = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { uploadClaim, checkStatus, updateClaim } = require('../controllers/claimController');

router.post('/upload', protect, uploadMiddleware, uploadClaim);
router.get('/status/:claimId', protect, checkStatus);
router.put('/:id', protect, updateClaim);

module.exports = router;
