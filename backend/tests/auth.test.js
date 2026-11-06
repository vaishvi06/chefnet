const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/userModel');
const { setupDB } = require('./setup');

setupDB();

describe('Authentication & Security API', () => {
  const validCustomer = {
    name: 'Aarav Patel',
    email: 'aarav@test.com',
    password: 'Password123',
    role: 'customer',
    phone: '+919876543210'
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a customer successfully with 201 status and access token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validCustomer);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(validCustomer.email);
      expect(res.body.data.user.passwordHash).toBeUndefined(); // never returned
      expect(res.headers['set-cookie']).toBeDefined(); // refresh token cookie
    });

    it('should reject registration if email is duplicate with 409 status', async () => {
      await request(app).post('/api/v1/auth/register').send(validCustomer);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(validCustomer);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject password that does not meet policy (min 8 chars, letter + number)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        ...validCustomer,
        email: 'another@test.com',
        password: 'weak'
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject admin role registration from public endpoint', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        ...validCustomer,
        email: 'hacker@test.com',
        role: 'admin'
      });

      expect(res.status).toBe(400); // Caught by Joi validation allowing only customer or chef
    });
  });

  describe('POST /api/v1/auth/login and Account Lockout', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(validCustomer);
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: validCustomer.email,
        password: validCustomer.password
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should return generic invalid error for wrong password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: validCustomer.email,
        password: 'WrongPassword99'
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should lock account for 15 minutes after 5 consecutive failed login attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app).post('/api/v1/auth/login').send({
          email: validCustomer.email,
          password: 'WrongPassword99'
        });
      }

      // 6th attempt should return 403 Account Locked
      const res = await request(app).post('/api/v1/auth/login').send({
        email: validCustomer.email,
        password: validCustomer.password
      });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Account is temporarily locked');
    });
  });

  describe('POST /api/v1/auth/refresh (Token Rotation)', () => {
    it('should refresh access token and rotate refresh token cookie', async () => {
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send(validCustomer);

      const cookie = regRes.headers['set-cookie'];

      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookie);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.accessToken).toBeDefined();
      expect(refreshRes.headers['set-cookie']).toBeDefined(); // new rotated cookie
    });
  });

  describe('Password Reset Flow', () => {
    it('should send password reset token and update password successfully', async () => {
      await request(app).post('/api/v1/auth/register').send(validCustomer);

      // Forgot password request
      const forgotRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: validCustomer.email });

      expect(forgotRes.status).toBe(200);

      // Fetch user to obtain reset token hash
      const user = await User.findOne({ email: validCustomer.email }).select(
        '+passwordResetTokenHash'
      );
      expect(user.passwordResetTokenHash).toBeDefined();

      // Reset password with direct token testing using user
      const rawToken = 'test-token-value-1234';
      const { hashToken } = require('../src/utils/token');
      user.passwordResetTokenHash = hashToken(rawToken);
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save({ validateBeforeSave: false });

      const resetRes = await request(app)
        .post(`/api/v1/auth/reset-password/${rawToken}`)
        .send({ password: 'NewSecurePassword123' });

      expect(resetRes.status).toBe(200);

      // Login with new password
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: validCustomer.email,
        password: 'NewSecurePassword123'
      });

      expect(loginRes.status).toBe(200);
    });
  });
});
