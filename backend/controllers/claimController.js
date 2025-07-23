// CLAIMCHECK/backend/controllers/claimController.js

const Claim = require('../models/Claim');
const claimQueue = require('../queues/claimQueue');

// This controller is now fast and lightweight.
// Its only job is to validate, create a DB record, and schedule the job.
exports.uploadClaim = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No file uploaded.' });
  }

  try {
    // 1. Create the initial claim record in the database.
    const newClaim = await Claim.create({
      userId: req.user.id,
      filename: req.file.originalname,
      status: 'queued', // The default status
    });

    // 2. Add the job to the queue.
    //    We pass the claim's ID and the file's BUFFER, not a path.
    const job = await claimQueue.add('process-claim', {
      claimId: newClaim.id,
      fileBuffer: req.file.buffer, // Pass the buffer for in-memory processing
    });

    // 3. Update our claim record with the Job ID from BullMQ.
    newClaim.jobId = job.id;
    await newClaim.save();

    // 4. Respond IMMEDIATELY to the client with 202 Accepted.
    //    We send back the initial claim data so the frontend can start polling.
    res.status(202).json(newClaim);

  } catch (err) {
    console.error('Upload controller error:', err);
    res.status(500).json({ msg: 'Server error during claim submission.' });
  }
};

// This controller checks the database for the status of a given claim.
exports.checkStatus = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.claimId);

    // Security check: ensure the user requesting the status owns the claim.
    if (!claim || claim.userId.toString() !== req.user.id) {
      return res.status(404).json({ msg: 'Claim not found.' });
    }

    // Return the current state of the claim.
    res.status(200).json({
      jobId: claim.jobId,
      status: claim.status,
      fields: claim.fields,
      extractedText: claim.extractedText,
    });
  } catch (err) {
    console.error('Status check error:', err);
    res.status(500).json({ msg: 'Server error while checking status.' });
  }
};