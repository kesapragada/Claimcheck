// CLAIMCHECK/backend/controllers/claimController.js
const Claim = require('../models/Claim');
const claimQueue = require('../queues/claimQueue');
exports.uploadClaim = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No file uploaded.' });
  }
  try {
    const newClaim = await Claim.create({
      userId: req.user.id,
      filename: req.file.originalname,
    });

    // CRITICAL CHANGE: Pass the file PATH, not the buffer.
    const job = await claimQueue.add('process-claim', {
      claimId: newClaim.id,
      filePath: req.file.path, // Pass the path to the temp file
    });

    newClaim.jobId = job.id;
    await newClaim.save();
    res.status(202).json(newClaim);
  } catch (err) {
     console.error('Upload controller error:', err);
    res.status(500).json({ msg: 'Server error during claim submission.' });

  }
};
   
exports.updateClaim = async (req, res) => {
  const { id } = req.params;
  const { name, date, amount } = req.body;

  try {
    const claim = await Claim.findById(id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    if (claim.userId.toString() !== req.user.id)
      return res.status(403).json({ error: 'Unauthorized' });

    claim.correctedFields = { name, date, amount };
    await claim.save();

    res.json(claim);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update claim' });
  }
};

exports.checkStatus = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.claimId);

    if (!claim || claim.userId.toString() !== req.user.id) {
      return res.status(404).json({ msg: 'Claim not found.' });
    }

    res.status(200).json({
      jobId: claim.jobId,
      status: claim.status,
      fields: claim.fields,
      extractedText: claim.extractedText,
      correctedFields: claim.correctedFields,
    });
  } catch (err) {
    console.error('Status check error:', err);
    res.status(500).json({ msg: 'Server error while checking status.' });
  }
};
