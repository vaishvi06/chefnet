const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/userModel');
const { generateAccessToken } = require('../src/utils/token');
const { setupDB } = require('./setup');

setupDB();

describe('Role-Based Access Control (RBAC)', () => {
  let customerUser, chefUser, adminUser;
  let customerToken, chefToken, adminToken;

  beforeEach(async () => {
    customerUser = await User.create({
      name: 'Customer One',
      email: 'customer1@test.com',
      passwordHash: 'hashed_pw',
      role: 'customer',
      isEmailVerified: true
    });
    customerToken = generateAccessToken(customerUser);

    chefUser = await User.create({
      name: 'Chef One',
      email: 'chef1@test.com',
      passwordHash: 'hashed_pw',
      role: 'chef',
      isEmailVerified: true
    });
    chefToken = generateAccessToken(chefUser);

    adminUser = await User.create({
      name: 'Admin One',
      email: 'admin1@test.com',
      passwordHash: 'hashed_pw',
      role: 'admin',
      isEmailVerified: true
    });
    adminToken = generateAccessToken(adminUser);
  });

  it('should deny customer access to chef-only routes with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/chefs/register-kitchen')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ kitchenName: "Customer's Kitchen" });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should deny chef access to admin-only routes with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/admin/chefs/pending')
      .set('Authorization', `Bearer ${chefToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow admin access to admin endpoints with 200 OK', async () => {
    const res = await request(app)
      .get('/api/v1/admin/chefs/pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
