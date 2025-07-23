// CLAIMCHECK/backend/worker.js

const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const Tesseract = require('tesseract.js');

// Import your DB connection and models
const connectDB = require('./config/db');
const Claim = require('./models/Claim');

// Load environment variables
require('dotenv').config();

// --- Tesseract Field Extraction Logic (copied from original controller) ---
const extractFields = (text) => {
  const nameMatch = text.match(/Name:\s*([A-Za-z\s]+)/i);
  const dateMatch = text.match(/\b(\d{2}[-/.s]\d{2}[-/.s]\d{4})\b/);
  const amountMatch = text.match(/\$\s?(\d{1,3}(,\d{3})*(\.\d{2})?)/);

  return {
    name: nameMatch ? nameMatch[1].trim() : null,
    date: dateMatch ? dateMatch[1] : null,
    amount: amountMatch ? amountMatch[0] : null,
  };
};

// --- Worker Implementation ---
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // Important for long-running workers
});

// The main function to process a single job
const processClaimJob = async (job) => {
  const { claimId, fileBuffer } = job.data;
  
  // Update status to 'processing' in the database
  await Claim.findByIdAndUpdate(claimId, { status: 'processing' });

  // Convert the fileBuffer back to a Buffer object for Tesseract
  const buffer = Buffer.from(fileBuffer.data);

  // Perform OCR
  const result = await Tesseract.recognize(buffer, 'eng');
  const extractedText = result.data.text;

  // Extract structured fields
  const fields = extractFields(extractedText);

  // Update the claim with the final results and 'completed' status
  await Claim.findByIdAndUpdate(claimId, {
    status: 'completed',
    extractedText: extractedText,
    fields: fields,
  });
};

// --- Main Worker Initialization ---
const startWorker = async () => {
  console.log('Connecting to database...');
  await connectDB();
  console.log('Database connected.');

  console.log('Worker starting...');
  const worker = new Worker('claims', processClaimJob, { connection });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} has completed for claim ${job.data.claimId}`);
  });

  worker.on('failed', async (job, err) => {
    console.error(`Job ${job.id} has failed for claim ${job.data.claimId} with error: ${err.message}`);
    // If a job fails, update its status in the DB
    await Claim.findByIdAndUpdate(job.data.claimId, { status: 'failed' });
  });

  console.log('Worker is listening for jobs...');
};

startWorker();