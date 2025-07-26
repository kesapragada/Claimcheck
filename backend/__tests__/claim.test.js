//CLAIMCHECK/frontend/__tests__/claim.test.js
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const claimRoutes = require('../routes/claimRoutes');
const User = require('../models/User');
const Claim = require('../models/Claim');
const jwt = require('jsonwebtoken');

dotenv.config({ path: '../../.env' });

const app = express();
app.use(express.json());

// A simplified mock of the 'protect' middleware for testing purposes.
// This allows us to inject a user object into the request.
const mockProtect = (req, res, next) => {
  // Use the user provided in the test setup, or a default mock user.
  if (res.locals.user) {
    req.user = res.locals.user;
  } else {
    req.user = { _id: new mongoose.Types.ObjectId() };
  }
  next();
};
app.use('/api/claims', mockProtect, claimRoutes);

describe('Claim Routes', () => {
  let user1, user2;

  beforeAll(async () => {
    const mongoUri = process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1/claimcheck_test_claims';
    await mongoose.connect(mongoUri);
  });

  beforeEach(async () => {
    // Create two distinct users for authorization tests.
    user1 = await User.create({ name: 'User One', email: 'user1@example.com', password: 'password123' });
    user2 = await User.create({ name: 'User Two', email: 'user2@example.com', password: 'password123' });
  });

  afterEach(async () => {
    await User.deleteMany();
    await Claim.deleteMany();
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  it('should allow a user to fetch their own claim history', async () => {
    await Claim.create({ userId: user1._id, filename: 'claim1.pdf', s3Key: 'key1' });
    
    // In a real test, we would generate a token. Here, we inject the user via mock middleware.
    const res = await request(app)
      .get('/api/claims')
      .use((req, res, next) => { res.locals.user = user1; next(); }); // Set user for this request
      
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].filename).toBe('claim1.pdf');
  });

  it('should return an empty array if another user tries to fetch their history', async () => {
    await Claim.create({ userId: user1._id, filename: 'claim1.pdf', s3Key: 'key1' });
    
    // Make the request as user2
    const res = await request(app)
      .get('/api/claims')
      .use((req, res, next) => { res.locals.user = user2; next(); });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(0); // user2 should have no claims.
  });

  it('should return a 403 Forbidden error if user2 tries to access user1s claim by ID', async () => {
    const claim1 = await Claim.create({ userId: user1._id, filename: 'claim1.pdf', s3Key: 'key1' });

    // Make the request as user2, trying to access claim1
    const res = await request(app)
      .get(`/api/claims/${claim1._id}`)
      .use((req, res, next) => { res.locals.user = user2; next(); });
      
    expect(res.statusCode).toEqual(403);
  });
});