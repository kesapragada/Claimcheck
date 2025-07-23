//CLAIMCHECK/backend/queues/claimQueue.js
const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.REDIS_URL);

const claimQueue = new Queue('claims', { connection });

module.exports = claimQueue;
