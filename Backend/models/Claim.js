//CLAIMCHECK/backend/models/Claim.js
const mongoose = require('mongoose');

const ClaimSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  secureUrl: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
  jobId: {
    type: String,
  },
  status: {
    type: String,
    enum: ['queued', 'processing', 'completed', 'failed'],
    default: 'queued',
  },
  extractedText: {
    type: String,
    default: '',
  },
  fields: {
    name: { type: String, default: null },
    date: { type: Date, default: null },
    amount: { type: Number, default: null },
    currency: { type: String, default: null }, //-- FIX: Added currency field
  },
  correctedFields: {
    name: { type: String, default: null },
    date: { type: Date, default: null },
    amount: { type: Number, default: null },
    currency: { type: String, default: null }, //-- FIX: Added currency field
  },
}, { timestamps: true });

module.exports = mongoose.model('Claim', ClaimSchema);