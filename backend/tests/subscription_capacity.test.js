const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/userModel');
const Area = require('../src/models/areaModel');
const Subscription = require('../src/models/subscriptionModel');
const { generateAccessToken } = require('../src/utils/token');
const { setupDB } = require('./setup');

setupDB();

describe('Subscription & Capacity Control', () => {
  let customerUser, customerToken;
  let customerUser2, customerToken2;
  let chefUser, chefToken;
  let area;

  beforeEach(async () => {
    area = await Area.create({
      name: 'Active Area',
      type: 'locality',
      center: { type: 'Point', coordinates: [77.6741, 12.9279] },
      isActive: true,
      activationThreshold: 1
    });

    // Chef with maxSubscribers = 1
    chefUser = await User.create({
      name: 'Chef Anita',
      email: 'anita@test.com',
      passwordHash: 'pw',
      role: 'chef',
      isEmailVerified: true,
      isLocationVerified: true,
      location: { type: 'Point', coordinates: [77.6743, 12.9281] },
      area: area._id,
      chefProfile: {
        kitchenName: "Anita's Kitchen",
        verificationStatus: 'approved',
        isVerified: true,
        maxSubscribers: 1,
        availabilityStatus: 'accepting'
      }
    });
    chefToken = generateAccessToken(chefUser);

    customerUser = await User.create({
      name: 'Customer 1',
      email: 'cust1@test.com',
      passwordHash: 'pw',
      role: 'customer',
      isEmailVerified: true,
      isLocationVerified: true,
      location: { type: 'Point', coordinates: [77.6741, 12.9279] },
      area: area._id
    });
    customerToken = generateAccessToken(customerUser);

    customerUser2 = await User.create({
      name: 'Customer 2',
      email: 'cust2@test.com',
      passwordHash: 'pw',
      role: 'customer',
      isEmailVerified: true,
      isLocationVerified: true,
      location: { type: 'Point', coordinates: [77.6742, 12.928] },
      area: area._id
    });
    customerToken2 = generateAccessToken(customerUser2);
  });

  it('should create subscription request in pending status', async () => {
    const res = await request(app)
      .post('/api/v1/subscriptions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        chefId: chefUser._id.toString(),
        planType: 'weekly',
        mealPlan: 'lunch'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.subscription.status).toBe('pending');
  });

  it('should block duplicate active/pending subscriptions for same customer, chef, and mealPlan', async () => {
    await request(app)
      .post('/api/v1/subscriptions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        chefId: chefUser._id.toString(),
        planType: 'weekly',
        mealPlan: 'lunch'
      });

    const res = await request(app)
      .post('/api/v1/subscriptions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        chefId: chefUser._id.toString(),
        planType: 'weekly',
        mealPlan: 'lunch'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should accept subscription and set chef status to full when capacity reached', async () => {
    const subRes = await request(app)
      .post('/api/v1/subscriptions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        chefId: chefUser._id.toString(),
        planType: 'weekly',
        mealPlan: 'lunch'
      });

    const subId = subRes.body.data.subscription._id;

    // Chef accepts subscription
    const acceptRes = await request(app)
      .patch(`/api/v1/subscriptions/${subId}/accept`)
      .set('Authorization', `Bearer ${chefToken}`);

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.subscription.status).toBe('active');

    // Verify chef availability turned to 'full'
    const updatedChef = await User.findById(chefUser._id);
    expect(updatedChef.chefProfile.availabilityStatus).toBe('full');

    // New subscription request should be rejected because chef is full
    const fullRes = await request(app)
      .post('/api/v1/subscriptions')
      .set('Authorization', `Bearer ${customerToken2}`)
      .send({
        chefId: chefUser._id.toString(),
        planType: 'weekly',
        mealPlan: 'lunch'
      });

    expect(fullRes.status).toBe(400);
    expect(fullRes.body.message).toContain('full');
  });
});
