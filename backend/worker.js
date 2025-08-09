// CLAIMCHECK/backend/worker.js - FINAL pdf2pic VERSION

const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const Tesseract = require('tesseract.js');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const { createWriteStream } = require('fs');
const axios = require('axios');
const { fromPath } = require("pdf2pic"); // Using the correct library

const Claim = require('./models/Claim');
const logger = require('./config/logger');
const redisPub = new IORedis(process.env.REDIS_URL);


const extractFields = (text) => {
  const nameLineMatch = text.match(/^(?:name|claimant|applicant|patient|submitted by)\s*[:-\s]\s*(.*)$/im);
  let extractedName = null;
  if (nameLineMatch && nameLineMatch[1]) {
    let potentialName = nameLineMatch[1];
    const cleanupPattern = /\s+(?:date|policy|claim|service|report|id).*/i;
    extractedName = potentialName.replace(cleanupPattern, '').trim();
  }
  const dateMatch = text.match(/\b(\d{1,2}[-/.s]\d{1,2}[-/.s]\d{2,4})\b/);
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
  return { name: extractedName, date: finalDate, amount: bestAmount, currency: detectedCurrency };
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


const processClaimJob = async (job) => {
    const { claimId, signedUrl } = job.data;
    const tempPdfPath = path.join(os.tmpdir(), `claim-${claimId}-${Date.now()}.pdf`);
    const writer = createWriteStream(tempPdfPath);
    let finalImagePath = null;

    try {
        await Claim.findByIdAndUpdate(claimId, { status: 'processing' });
        await publishUpdate(claimId);

        const response = await axios({ url: signedUrl, method: 'GET', responseType: 'stream' });
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        const options = {
            density: 300,
            saveFilename: `claim-image-${claimId}-${Date.now()}`,
            savePath: os.tmpdir(),
            format: "png",
            width: 1600,
            height: 2200
        };
        const convert = fromPath(tempPdfPath, options);
        const pageToConvertAsImage = 1;
        const conversionResult = await convert(pageToConvertAsImage, { responseType: "image" });
        finalImagePath = conversionResult.path;

        logger.info(`Successfully converted PDF to image: ${finalImagePath}`);
        const result = await Tesseract.recognize(finalImagePath, 'eng');
        
        const fields = extractFields(result.data.text);

        await Claim.findByIdAndUpdate(claimId, { status: 'completed', extractedText: result.data.text, fields });
        await publishUpdate(claimId);


    } catch (err) {
        console.error("FULL ERROR:", err); // <-- Add this

        logger.error(`[Worker] Error processing claim ${claimId}`, { error: err.message, stack: err.stack });
        await Claim.findByIdAndUpdate(claimId, { status: 'failed' });
        await publishUpdate(claimId);
    } finally {
        // Use a simple catch to avoid crashing if file doesn't exist
        await fs.unlink(tempPdfPath).catch(() => {});
        if (finalImagePath) {
            await fs.unlink(finalImagePath).catch(() => {});
        }
    }
};

const startWorker = () => {
  const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  const worker = new Worker('claims', processClaimJob, {
    connection,
    concurrency: 5
  });
  worker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed with error ${err.message}`);
  });
  logger.info('Worker is ready and listening for jobs in the main server process...');
};

module.exports = { startWorker };