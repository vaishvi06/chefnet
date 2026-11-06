const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/userModel');
const Area = require('../src/models/areaModel');
const Meal = require('../src/models/mealModel');
const DailyMenu = require('../src/models/dailyMenuModel');
const Subscription = require('../src/models/subscriptionModel');
const Reservation = require('../src/models/reservationModel');
const { generateAccessToken } = require('../src/utils/token');
const { setupDB } = require('./setup');

setupDB();

describe('Reservation, Cutoff, Status Transitions & QR Pickup', () => {
  let customerUser, customerToken;
  let chefUser, chefToken;
  let meal, dailyMenu, subscription;

  beforeEach(async () => {
    const area = await Area.create({
      name: 'Active Area',
      type: 'locality',
      center: { type: 'Point', coordinates: [77.6741, 12.9279] },
      isActive: true
    });

    chefUser = await User.create({
      name: 'Chef Shanti',
      email: 'shanti@test.com',
      passwordHash: 'pw',
      role: 'chef',
      isEmailVerified: true,
      isLocationVerified: true,
      location: { type: 'Point', coordinates: [77.6743, 12.9281] },
      area: area._id,
      chefProfile: {
        kitchenName: "Shanti's Kitchen",
        verificationStatus: 'approved',
        isVerified: true
      }
    });
    chefToken = generateAccessToken(chefUser);

    customerUser = await User.create({
      name: 'Rohan Customer',
      email: 'rohan@test.com',
      passwordHash: 'pw',
      role: 'customer',
      isEmailVerified: true,
      isLocationVerified: true,
      location: { type: 'Point', coordinates: [77.6741, 12.9279] },
      area: area._id
    });
    customerToken = generateAccessToken(customerUser);

    meal = await Meal.create({
      chef: chefUser._id,
      name: 'Kathiyawadi Thali',
      price: 120,
      category: 'gujarati',
      mealType: 'lunch'
    });

    // Active subscription
    subscription = await Subscription.create({
      customer: customerUser._id,
      chef: chefUser._id,
      planType: 'weekly',
      mealPlan: 'lunch',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Daily menu with cutoff 2 hours in the future
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    dailyMenu = await DailyMenu.create({
      chef: chefUser._id,
      menuDate: today,
      mealType: 'lunch',
      meals: [meal._id],
      pickupStart: '12:00',
      pickupEnd: '14:00',
      cutoffTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // future cutoff
      quantityAvailable: 5
    });
  });

  it('should create reservation and atomically decrement quantityAvailable', async () => {
    const res = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        subscriptionId: subscription._id.toString(),
        dailyMenuId: dailyMenu._id.toString(),
        mealId: meal._id.toString(),
        reserveDate: dailyMenu.menuDate,
        mealType: 'lunch'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reservation.status).toBe('reserved');
    expect(res.body.data.qrCodeDataUrl).toBeDefined();

    // Verify atomic decrement
    const updatedMenu = await DailyMenu.findById(dailyMenu._id);
    expect(updatedMenu.quantityAvailable).toBe(4);
  });

  it('should reject reservation if cutoff time has already passed', async () => {
    // Set cutoff to 10 minutes ago
    dailyMenu.cutoffTime = new Date(Date.now() - 10 * 60 * 1000);
    await dailyMenu.save();

    const res = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        subscriptionId: subscription._id.toString(),
        dailyMenuId: dailyMenu._id.toString(),
        mealId: meal._id.toString(),
        reserveDate: dailyMenu.menuDate,
        mealType: 'lunch'
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('cutoff time');
  });

  it('should enforce strict status transitions (reserved -> preparing -> ready -> picked_up) and reject invalid transitions', async () => {
    const resResponse = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        subscriptionId: subscription._id.toString(),
        dailyMenuId: dailyMenu._id.toString(),
        mealId: meal._id.toString(),
        reserveDate: dailyMenu.menuDate,
        mealType: 'lunch'
      });

    const resId = resResponse.body.data.reservation._id;

    // Invalid transition: jump directly from reserved to ready
    const invalidJump = await request(app)
      .patch(`/api/v1/reservations/${resId}/status`)
      .set('Authorization', `Bearer ${chefToken}`)
      .send({ status: 'ready' });

    expect(invalidJump.status).toBe(400);
    expect(invalidJump.body.message).toContain('Invalid status transition');

    // Valid transition: reserved -> preparing
    const prepRes = await request(app)
      .patch(`/api/v1/reservations/${resId}/status`)
      .set('Authorization', `Bearer ${chefToken}`)
      .send({ status: 'preparing' });

    expect(prepRes.status).toBe(200);
    expect(prepRes.body.data.reservation.status).toBe('preparing');

    // Valid transition: preparing -> ready
    const readyRes = await request(app)
      .patch(`/api/v1/reservations/${resId}/status`)
      .set('Authorization', `Bearer ${chefToken}`)
      .send({ status: 'ready' });

    expect(readyRes.status).toBe(200);
    expect(readyRes.body.data.reservation.status).toBe('ready');
  });

  it('should verify signed QR token and complete meal pickup', async () => {
    const resResponse = await request(app)
      .post('/api/v1/reservations')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        subscriptionId: subscription._id.toString(),
        dailyMenuId: dailyMenu._id.toString(),
        mealId: meal._id.toString(),
        reserveDate: dailyMenu.menuDate,
        mealType: 'lunch'
      });

    const resId = resResponse.body.data.reservation._id;
    const qrToken = resResponse.body.data.reservation.qrToken;

    // Advance to preparing then ready
    await request(app)
      .patch(`/api/v1/reservations/${resId}/status`)
      .set('Authorization', `Bearer ${chefToken}`)
      .send({ status: 'preparing' });

    await request(app)
      .patch(`/api/v1/reservations/${resId}/status`)
      .set('Authorization', `Bearer ${chefToken}`)
      .send({ status: 'ready' });

    // Chef scans customer's QR code
    const verifyRes = await request(app)
      .post('/api/v1/reservations/verify-qr')
      .set('Authorization', `Bearer ${chefToken}`)
      .send({ qrToken });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.reservation.status).toBe('picked_up');
    expect(verifyRes.body.data.reservation.pickedUpAt).toBeDefined();

    // Scanning already picked up meal should fail
    const scanAgain = await request(app)
      .post('/api/v1/reservations/verify-qr')
      .set('Authorization', `Bearer ${chefToken}`)
      .send({ qrToken });

    expect(scanAgain.status).toBe(400);
    expect(scanAgain.body.message).toContain('already picked up');
  });
});
