// CLAIMCHECK/backend/models/Claim.js
const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema({
  userId: { // Changed from 'user' to 'userId' for consistency
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true 
  },
  filename: { 
    type: String, 
    required: true 
  },
  extractedText: { 
    type: String, 
    default: '' 
  },
  fields: {
    name: { type: String },
    date: { type: String },
    amount: { type: String }
  },
  jobId: { 
    type: String 
  },
  status: {
    type: String,
    // Add 'failed' to the possible statuses
    enum: ['queued', 'processing', 'completed', 'failed'], 
    default: 'queued'
  }
}, { timestamps: true });

module.exports = mongoose.model('Claim', ClaimSchema);