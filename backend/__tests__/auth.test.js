//CLAIMCHECK/backend/__tests__/auth.test.js
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('../routes/authRoutes');
const User = require('../models/User');

dotenv.config({ path: '../../.env' });

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1/claimcheck_test_auth';
    await mongoose.connect(mongoUri);
  });

  afterEach(async () => {
    await User.deleteMany();
  });

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  // ... (successful registration test)

  it('should fail registration if validation fails', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'not-an-email', password: '123' });
    expect(res.statusCode).toEqual(400);
    expect(res.body.errors).toHaveLength(2); // email and password fail
  });

  it('should login a registered user successfully', async () => {
    // First, register a user
    await request(app).post('/api/auth/register').send({ name: 'Login User', email: 'login@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });
      
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should fail to login with incorrect password', async () => {
    await request(app).post('/api/auth/register').send({ name: 'Login User', email: 'login@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrongpassword' });
      
    expect(res.statusCode).toEqual(401);
    expect(res.body.msg).toBe('Invalid credentials.');
  });
  
  it('should allow accessing a protected route with a valid token', async () => {
    const loginRes = await request(app).post('/api/auth/register').send({ name: 'Protected User', email: 'protected@example.com', password: 'password123' });
    const token = loginRes.body.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
      
    expect(res.statusCode).toEqual(200);
    expect(res.body.email).toBe('protected@example.com');
  });

  it('should deny access to a protected route with an invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer badtoken`);
      
    expect(res.statusCode).toEqual(401);
  });
});