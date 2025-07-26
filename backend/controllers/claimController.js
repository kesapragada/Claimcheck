//CLAIMCHECK/backend/controllers/claimController.js

// This controller receives the upload result from the frontend.
// The 'protect' middleware guarantees that req.user exists.
const Claim = require('../models/Claim');
const claimQueue = require('../queues/claimQueue');
const cloudinary = require('../config/cloudinary');

exports.createClaim = async (req, res, next) => {
  const { filename, secureUrl, publicId } = req.body;
  try {
    // We no longer need the 'explicit' call. The asset can remain private.

    // --- GENERATE A SIGNED, TEMPORARY DOWNLOAD URL ---
    const signedDownloadUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
      type: 'upload',
      // The URL will be valid for 10 minutes.
      // This gives the worker plenty of time to grab the file.
      expires_at: Math.floor(Date.now() / 1000) + 600 
    });
    // -----------------------------------------------

    const newClaim = await Claim.create({
      userId: req.user.id,
      filename,
      secureUrl, // Store the permanent URL for later use if needed
      publicId,
    });

    await claimQueue.add('process-claim', {
      claimId: newClaim.id,
      // Pass the temporary, signed URL to the worker.
      signedUrl: signedDownloadUrl, 
    });

    res.status(201).json(newClaim);
  } catch (err) {
    console.error("Error in createClaim:", err);
    next(err);
  }
};
exports.updateClaim = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ msg: 'Claim not found.' });
    if (claim.userId.toString() !== req.user.id) return res.status(403).json({ msg: 'User not authorized.' });
    
    const amountString = req.body.amount ? String(req.body.amount).replace(/[$,€£\s]/g, '') : '0';
    
    claim.correctedFields = {
      name: req.body.name,
      date: req.body.date ? new Date(req.body.date) : null,
      amount: parseFloat(amountString),
    };
    claim.status = 'completed';
    const updatedClaim = await claim.save();
    res.status(200).json(updatedClaim);
  } catch (err) {
    next(err);
  }
};

exports.getClaimById = async (req, res, next) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ msg: 'Claim not found.' });
    if (claim.userId.toString() !== req.user.id) return res.status(403).json({ msg: 'User not authorized.' });
    res.status(200).json(claim);
  } catch (err) {
    next(err);
  }
};

exports.getClaimHistory = async (req, res, next) => {
  try {
    const claims = await Claim.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(claims);
  } catch (err) {
    next(err);
  }
};