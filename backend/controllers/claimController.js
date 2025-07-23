// CLAIMCHECK/backend/controllers/claimController.js

const Claim = require('../models/Claim');
const claimQueue = require('../queues/claimQueue');

// Controller to upload and queue a new claim
const uploadClaim = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No file uploaded.' });
  }
  try {
    const newClaim = await Claim.create({
      userId: req.user.id,
      filename: req.file.originalname,
    });
    const job = await claimQueue.add('process-claim', {
      claimId: newClaim.id,
      filePath: req.file.path,
    });
    newClaim.jobId = job.id;
    await newClaim.save();
    res.status(202).json(newClaim);
  } catch (err) {
    console.error('Upload controller error:', err);
    res.status(500).json({ msg: 'Server error during claim submission.' });
  }
};

// Controller to update corrected fields for a claim
const updateClaim = async (req, res) => {
  const { id } = req.params;
  const { name, date, amount } = req.body;
  try {
    const claim = await Claim.findById(id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (claim.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    claim.correctedFields = { name, date, amount };
    await claim.save();
    res.json(claim);
  } catch (err) {
    console.error('Update claim error:', err);
    res.status(500).json({ error: 'Failed to update claim' });
  }
};

// Controller to check the status of a specific claim
const checkStatus = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.claimId);
    if (!claim || claim.userId.toString() !== req.user.id) {
      return res.status(404).json({ msg: 'Claim not found.' });
    }
    res.status(200).json(claim); // Return the full claim object for consistency
  } catch (err) {
    console.error('Status check error:', err);
    res.status(500).json({ msg: 'Server error while checking status.' });
  }
};

// --- NEW HISTORY CONTROLLER ---
// Controller to get all claims for the logged-in user
const getClaimHistory = async (req, res) => {
  try {
    const claims = await Claim.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(claims);
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ msg: 'Server error while fetching history.' });
  }
};


// Use a single, consistent module.exports object for all functions
module.exports = {
  uploadClaim,
  updateClaim,
  checkStatus,
  getClaimHistory,
};