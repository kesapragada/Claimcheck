//CLAIMCHECK/backend/server.js

// Load environment variables immediately, once, at the very top of the application entry point.
const dotenv = require('dotenv');
dotenv.config();

// Now, all other imports will have access to process.env
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const cors = require('cors');
const IORedis = require('ioredis');
const connectDB = require('./config/db');
const logger = require('./config/logger');
const authRoutes = require('./routes/authRoutes');
const claimRoutes = require('./routes/claimRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT"]
  }
});

const pubClient = new IORedis(process.env.REDIS_URL);
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('registerUserSocket', (userId) => {
    if (userId) {
      console.log(`Socket ${socket.id} joining user room: user-${userId}`);
      socket.join(`user-${userId}`);
    }
  });
  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

subClient.subscribe('claim-updates', (err) => {
  if (err) logger.error('Failed to subscribe to claim-updates', { error: err.message });
});

subClient.on('message', (channel, message) => {
  if (channel === 'claim-updates') {
    try {
      const { userId, claim } = JSON.parse(message);
      io.to(`user-${userId}`).emit('claimUpdate', claim);
      logger.info(`Broadcasted update for claim ${claim._id} to room user-${userId}`);
    } catch (e) {
      logger.error('Failed to parse/send Redis message', { error: e.message });
    }
  }
});

connectDB();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/auth', authRoutes);
app.use('/api/claims', claimRoutes);

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

// Error handling middleware
app.use((err, req, res, next) => {
  const errorContext = {
    requestId: req.headers['x-request-id'],
    path: req.path,
    method: req.method,
    error: {
      message: err.message,
      stack: err.stack,
    },
  };
  logger.error('An unexpected server error occurred', errorContext);
  res.status(500).json({ msg: 'An unexpected server error occurred.' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
