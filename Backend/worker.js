// CLAIMCHECK/backend/worker.js

// The dotenv config is now handled by server.js, so we can remove it from here.
// const dotenv = require('dotenv');
// dotenv.config({ path: '../.env' });

const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const Tesseract = require('tesseract.js');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const { createWriteStream } = require('fs');
const axios = require('axios');
const poppler = require('pdf-poppler');

// The DB connection is now handled by server.js.
// const connectDB = require('./config/db');
const Claim = require('./models/Claim');
const logger = require('./config/logger');

const redisPub = new IORedis(process.env.REDIS_URL);

// --- NO CHANGES NEEDED IN THESE HELPER FUNCTIONS ---
const extractFields = (text) => {
  // ... your existing logic for extracting fields ...
  // --- FINAL NAME EXTRACTION LOGIC ---
  const nameLineMatch = text.match(/^(?:name|claimant|applicant|patient|submitted by)\s*[:-\s]\s*(.*)$/im);
  let extractedName = null;
  if (nameLineMatch && nameLineMatch[1]) {
    let potentialName = nameLine-match[1];
    const cleanupPattern = /\s+(?:date|policy|claim|service|report|id).*/i;
    extractedName = potentialName.replace(cleanupPattern, '').trim();
  }

  // --- FINAL DATE EXTRACTION LOGIC ---
  const dateMatch = text.match(/\b(\d{1,2}[-/.s]\d{1,2}[-/.s]\d{2,4})\b/);

  // --- FINAL AMOUNT EXTRACTION LOGIC ---
  const amountMatches = text.matchAll(/(?:total amount|balance duc|balance due|amount due|total charges|total chirges|payment|total|amount|charge)\s*[:-\s]?(?<currency>[$€£₹])?\s*(?<value>[\d,]+\.\d{2})/gi);

  let bestAmount = null;
  let detectedCurrency = null;
  let highestValue = -1;
  for (const match of amountMatches) {
    const value = parseFloat(match.groups.value.replace(/,/g, ''));
    if (value > highestValue) {
      highestValue = value;
      bestAmount = value;
      detectedCurrency = match.groups.currency || null;
    }
  }

  const parsedDateString = dateMatch && dateMatch[1] ? dateMatch[1] : null;
  const parsedDate = parsedDateString ? new Date(parsedDateString) : null;
  const finalDate = parsedDate && !isNaN(parsedDate) ? parsedDate : null;

  return {
    name: extractedName,
    date: finalDate,
    amount: bestAmount,
    currency: detectedCurrency,
  };
};

const publishUpdate = async (claimId) => {
  try {
    const updatedClaim = await Claim.findById(claimId);
    if (updatedClaim) {
      const message = JSON.stringify({ userId: updatedClaim.userId.toString(), claim: updatedClaim });
      await redisPub.publish('claim-updates', message);
    }
  } catch (e) {
    logger.error(`[Worker] Failed to publish update for claim ${claimId}`, { error: e.message });
  }
};
// --- END OF HELPER FUNCTIONS ---

const processClaimJob = async (job) => {
  const { claimId, signedUrl } = job.data;
  const tempPdfPath = path.join(os.tmpdir(), `claim-${claimId}-${Date.now()}.pdf`);
  const writer = createWriteStream(tempPdfPath);
  const tempImageBase = path.join(os.tmpdir(), `claim-image-${claimId}-${Date.now()}`);
  try {
    await Claim.findByIdAndUpdate(claimId, { status: 'processing' });
    await publishUpdate(claimId);
    const response = await axios({ url: signedUrl, method: 'GET', responseType: 'stream' });
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    const convertOptions = {
      format: 'png',
      out_dir: os.tmpdir(),
      out_prefix: path.basename(tempImageBase),
      page: 1
    };
    await poppler.convert(tempPdfPath, convertOptions);
    const finalImagePath = `${tempImageBase}-1.png`;
    const result = await Tesseract.recognize(finalImagePath, 'eng');
    console.log("--- RAW OCR TEXT ---", result.data.text);
    const fields = extractFields(result.data.text);
    await Claim.findByIdAndUpdate(claimId, { status: 'completed', extractedText: result.data.text, fields });
    await publishUpdate(claimId);

  } catch (err) {
    logger.error(`[Worker] Error processing claim ${claimId}`, { error: err.message, stack: err.stack });
    await Claim.findByIdAndUpdate(claimId, { status: 'failed' });
    await publishUpdate(claimId);
  } finally {
    await fs.unlink(tempPdfPath).catch(err => logger.warn(`[Worker] Failed to delete temp PDF ${tempPdfPath}`, { error: err.message }));
    const finalImagePath = `${tempImageBase}-1.png`;
    await fs.unlink(finalImagePath).catch(err => {
      if (err.code !== 'ENOENT') {
        logger.warn(`[Worker] Failed to delete temp PNG ${finalImagePath}`, { error: err.message });
      }
    });
  }
};


// --- THIS IS THE KEY CHANGE ---
// We wrap the worker startup logic in an exported function.
const startWorker = () => {
  // We no longer need to connect to the DB here because server.js already does it.
  const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });

  // Concurrency is important. It means the worker can process up to 5 jobs at once
  // without completely blocking the single event loop of our combined server.
  const worker = new Worker('claims', processClaimJob, {
    connection,
    concurrency: 5
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed with error ${err.message}`);
  });

  logger.info('Worker is ready and listening for jobs in the main server process...');
};

// We remove the old self-invoking call:
// startWorker();

// And instead, we export the function for server.js to use.
module.exports = { startWorker };