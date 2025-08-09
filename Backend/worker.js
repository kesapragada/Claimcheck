// CLAIMCHECK/backend/worker.js - FINAL PURE JAVASCRIPT VERSION

const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const Tesseract = require('tesseract.js');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const { createWriteStream } = require('fs');
const axios = require('axios');

// --- NEW IMPORTS FOR PURE JS PDF PROCESSING ---
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
const { createCanvas } = require('canvas');
// ---------------------------------------------

const Claim = require('./models/Claim');
const logger = require('./config/logger');
const redisPub = new IORedis(process.env.REDIS_URL);


const extractFields = (text) => { /* ... no changes needed ... */ };
const publishUpdate = async (claimId) => { /* ... no changes needed ... */ };
// (Your extractFields and publishUpdate functions are fine)


// --- NEW HELPER FUNCTION TO RENDER PDF PAGE ---
async function renderPage(page) {
    const viewport = page.getViewport({ scale: 3.0 }); // Increase scale for higher resolution
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext('2d');
    const renderContext = {
        canvasContext: context,
        viewport: viewport,
    };
    await page.render(renderContext).promise;
    return canvas;
}
// -------------------------------------------


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

        // --- NEW PURE JAVASCRIPT PDF TO IMAGE CONVERSION ---
        const data = new Uint8Array(await fs.readFile(tempPdfPath));
        const doc = await pdfjs.getDocument(data).promise;
        const page = await doc.getPage(1); // Get the first page

        const canvas = await renderPage(page);
        
        finalImagePath = path.join(os.tmpdir(), `claim-image-${claimId}-${Date.now()}.png`);
        const out = require('fs').createWriteStream(finalImagePath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);
        await new Promise((resolve, reject) => {
            out.on('finish', resolve);
            out.on('error', reject);
        });
        // --- END OF NEW CONVERSION LOGIC ---

        logger.info(`Successfully converted PDF to image: ${finalImagePath}`);
        const result = await Tesseract.recognize(finalImagePath, 'eng');
        
        logger.info("--- RAW OCR TEXT ---", { text: result.data.text });
        const fields = extractFields(result.data.text);

        await Claim.findByIdAndUpdate(claimId, { status: 'completed', extractedText: result.data.text, fields });
        await publishUpdate(claimId);

    } catch (err) {
        logger.error(`[Worker] Error processing claim ${claimId}`, { error: err.message, stack: err.stack });
        await Claim.findByIdAndUpdate(claimId, { status: 'failed' });
        await publishUpdate(claimId);
    } finally {
        // Cleanup logic is the same
        await fs.unlink(tempPdfPath).catch(err => { /* ... */ });
        if (finalImagePath) {
            await fs.unlink(finalImagePath).catch(err => { /* ... */ });
        }
    }
};

const startWorker = () => { /* ... no changes needed ... */ };
module.exports = { startWorker };