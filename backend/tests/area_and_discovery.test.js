const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/userModel');
const Area = require('../src/models/areaModel');
const Meal = require('../src/models/mealModel');
const WaitingListEntry = require('../src/models/waitingListModel');
const { generateAccessToken } = require('../src/utils/token');
const { setupDB } = require('./setup');

setupDB();

describe('Area Activation & 1 km Geospatial Discovery', () => {
  let customerUser, customerToken;
  let area;

  beforeEach(async () => {
    // Create Area with activationThreshold = 2
    area = await Area.create({
      name: 'Green Glen Locality',
      type: 'locality',
      center: {
        type: 'Point',
        coordinates: [77.6741, 12.9279]
      },
      radiusInMeters: 2000,
      isActive: false,
      activationThreshold: 2
    });

    customerUser = await User.create({
      name: 'Rohan Customer',
      email: 'rohan.cust@test.com',
      passwordHash: 'hashed_pw',
      role: 'customer',
      isEmailVerified: true
    });
    customerToken = generateAccessToken(customerUser);
  });

  it('should add customer to waiting list and return inactive message if area threshold not met', async () => {
    const res = await request(app)
      .post('/api/v1/users/me/location')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ latitude: 12.928, longitude: 77.6742 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(false);
    expect(res.body.data.waitingList).toBe(true);
    expect(res.body.data.areaActive).toBe(false);

    // Verify waiting list entry exists
    const entry = await WaitingListEntry.findOne({ customer: customerUser._id });
    expect(entry).toBeDefined();

    const updatedArea = await Area.findById(area._id);
    expect(updatedArea.demandCount).toBe(1);
  });

  it('should auto-activate area once approved chefs reach the threshold', async () => {
    // Create 2 chefs in this area
    const chef1 = await User.create({
      name: 'Chef One',
      email: 'chef1@test.com',
      passwordHash: 'pw',
      role: 'chef',
      isEmailVerified: true,
      isLocationVerified: true,
      location: { type: 'Point', coordinates: [77.6743, 12.9281] },
      area: area._id,
      chefProfile: {
        kitchenName: 'Kitchen 1',
        verificationStatus: 'approved',
        isVerified: true
      }
    });

    const chef2 = await User.create({
      name: 'Chef Two',
      email: 'chef2@test.com',
      passwordHash: 'pw',
      role: 'chef',
      isEmailVerified: true,
      isLocationVerified: true,
      location: { type: 'Point', coordinates: [77.6745, 12.9283] },
      area: area._id,
      chefProfile: {
        kitchenName: 'Kitchen 2',
        verificationStatus: 'approved',
        isVerified: true
      }
    });

    // Customer verifies location now that 2 approved chefs exist
    const res = await request(app)
      .post('/api/v1/users/me/location')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ latitude: 12.928, longitude: 77.6742 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.areaActive).toBe(true);

    const updatedArea = await Area.findById(area._id);
    expect(updatedArea.isActive).toBe(true);
  });

  it('should discover chefs within 1 km and exclude chefs beyond 1 km', async () => {
    area.isActive = true;
    await area.save();

    // Nearby chef (~60 meters away)
    const nearbyChef = await User.create({
      name: 'Nearby Chef',
      email: 'nearby@test.com',
      passwordHash: 'pw',
      role: 'chef',
      isEmailVerified: true,
      isLocationVerified: true,
      location: { type: 'Point', coordinates: [77.6743, 12.9281] },
      area: area._id,
      ratingAverage: 4.8,
      ratingCount: 10,
      chefProfile: {
        kitchenName: 'Nearby Kitchen',
        verificationStatus: 'approved',
        isVerified: true,
        availabilityStatus: 'accepting'
      }
    });

    // Far away chef (~10 km away)
    await User.create({
      name: 'Far Chef',
      email: 'far@test.com',
      passwordHash: 'pw',
      role: 'chef',
      isEmailVerified: true,
      isLocationVerified: true,
      location: { type: 'Point', coordinates: [77.75, 12.98] },
      area: area._id,
      chefProfile: {
        kitchenName: 'Far Kitchen',
        verificationStatus: 'approved',
        isVerified: true,
        availabilityStatus: 'accepting'
      }
    });

    // Customer at [77.6741, 12.9279]
    customerUser.location = { type: 'Point', coordinates: [77.6741, 12.9279] };
    customerUser.isLocationVerified = true;
    customerUser.area = area._id;
    await customerUser.save();

    const res = await request(app)
      .get('/api/v1/discovery/chefs')
      .set('Authorization', `Bearer ${customerToken}`)
      .query({ lat: 12.9279, lng: 77.6741 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.chefs.length).toBe(1);
    expect(res.body.data.chefs[0].name).toBe(nearbyChef.name);
    expect(res.body.data.chefs[0].distanceInMeters).toBeLessThan(1000);
  });
});
