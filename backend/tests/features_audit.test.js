const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/userModel');
const Area = require('../src/models/areaModel');
const Meal = require('../src/models/mealModel');
const DailyMenu = require('../src/models/dailyMenuModel');
const Subscription = require('../src/models/subscriptionModel');
const Reservation = require('../src/models/reservationModel');
const Complaint = require('../src/models/complaintModel');
const { setupDB } = require('./setup');

setupDB();

describe('ChiefNet Audited & Fixed Features Tests', () => {
  let customerToken, chefToken, adminToken;
  let customerUser, chefUser, adminUser, testArea, testMeal, testMenu, testSub, testRes;

  beforeEach(async () => {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123#Secure', salt);

    // 1. Create Area
    testArea = await Area.create({
      name: 'Indiranagar 100ft',
      type: 'locality',
      center: { type: 'Point', coordinates: [77.6408, 12.9719] },
      radiusInMeters: 2000,
      isActive: true,
      activationThreshold: 1
    });

    // 2. Create Admin
    adminUser = await User.create({
      name: 'Chief Admin',
      email: 'admin.test@chiefnet.com',
      passwordHash,
      role: 'admin',
      isEmailVerified: true,
      isLocationVerified: true
    });

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin.test@chiefnet.com', password: 'Password123#Secure' });
    adminToken = adminLogin.body.data.accessToken;

    // 3. Create Chef
    chefUser = await User.create({
      name: 'Chef Ananya',
      email: 'ananya.chef@chiefnet.com',
      passwordHash,
      role: 'chef',
      isEmailVerified: true,
      isLocationVerified: true,
      area: testArea._id,
      location: { type: 'Point', coordinates: [77.6408, 12.9719] },
      chefProfile: {
        kitchenName: "Ananya's South Rasoi",
        isVerified: true,
        verificationStatus: 'approved',
        kitchenCode: 'CHF-9988',
        dailyCapacity: 20,
        maxSubscribers: 10,
        availabilityStatus: 'accepting'
      }
    });

    const chefLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'ananya.chef@chiefnet.com', password: 'Password123#Secure' });
    chefToken = chefLogin.body.data.accessToken;

    // 4. Create Customer
    customerUser = await User.create({
      name: 'Kunal Patel',
      email: 'kunal.patel@chiefnet.com',
      passwordHash,
      role: 'customer',
      isEmailVerified: true,
      isLocationVerified: true,
      area: testArea._id,
      location: { type: 'Point', coordinates: [77.6410, 12.9720] }
    });

    const custLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'kunal.patel@chiefnet.com', password: 'Password123#Secure' });
    customerToken = custLogin.body.data.accessToken;

    // 5. Create Meal & Daily Menu
    testMeal = await Meal.create({
      chef: chefUser._id,
      name: 'Bisi Bele Bath',
      price: 120,
      category: 'south_indian',
      mealType: 'lunch',
      isVeg: true
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    testMenu = await DailyMenu.create({
      chef: chefUser._id,
      menuDate: today,
      mealType: 'lunch',
      meals: [testMeal._id],
      pickupStart: '12:30',
      pickupEnd: '14:30',
      cutoffTime: new Date(today.getTime() + 12 * 60 * 60 * 1000),
      quantityAvailable: 15
    });

    // 6. Create Active Subscription & Reservation
    testSub = await Subscription.create({
      customer: customerUser._id,
      chef: chefUser._id,
      planType: 'weekly',
      mealPlan: 'lunch',
      status: 'active',
      startDate: today,
      endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    });

    testRes = await Reservation.create({
      subscription: testSub._id,
      customer: customerUser._id,
      chef: chefUser._id,
      dailyMenu: testMenu._id,
      meal: testMeal._id,
      reserveDate: today,
      mealType: 'lunch',
      status: 'ready',
      qrToken: 'header.payload.signature',
      manualToken: 'CHF-9988-1234',
      price: 120
    });
  });

  describe('1. Favorites System', () => {
    it('should add chef to favorites, fetch favorites, and remove chef from favorites', async () => {
      // Add favorite
      const addRes = await request(app)
        .post(`/api/v1/customers/favorites/${chefUser._id}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(addRes.status).toBe(200);

      // Get favorites
      const getRes = await request(app)
        .get('/api/v1/customers/favorites')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.favorites.length).toBe(1);
      expect(getRes.body.data.favorites[0]._id).toBe(chefUser._id.toString());

      // Remove favorite
      const delRes = await request(app)
        .delete(`/api/v1/customers/favorites/${chefUser._id}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(delRes.status).toBe(200);
      expect(delRes.body.data.favorites.length).toBe(0);
    });
  });

  describe('2. Kitchen Queue & Verification', () => {
    it('should fetch kitchen queue with correct status counts for chef', async () => {
      const res = await request(app)
        .get('/api/v1/chefs/queue')
        .set('Authorization', `Bearer ${chefToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.counts.total).toBe(1);
      expect(res.body.data.counts.ready).toBe(1);
      expect(res.body.data.reservations[0].manualToken).toBe('CHF-9988-1234');
    });

    it('should verify reservation using manual token and mark as picked up', async () => {
      const res = await request(app)
        .post('/api/v1/reservations/verify')
        .set('Authorization', `Bearer ${chefToken}`)
        .send({ token: 'CHF-9988-1234' });

      expect(res.status).toBe(200);
      expect(res.body.data.reservation.status).toBe('picked_up');
      expect(res.body.data.reservation.verifiedAt).toBeTruthy();

      // Second pickup attempt should be rejected
      const retryRes = await request(app)
        .post('/api/v1/reservations/verify')
        .set('Authorization', `Bearer ${chefToken}`)
        .send({ token: 'CHF-9988-1234' });
      expect(retryRes.status).toBe(400);
    });

    it('should rotate kitchen code and refresh unpicked reservation tokens', async () => {
      const rotateRes = await request(app)
        .patch('/api/v1/chefs/me/kitchen-code')
        .set('Authorization', `Bearer ${chefToken}`)
        .send({ kitchenCode: 'CHF-7700' });

      expect(rotateRes.status).toBe(200);
      expect(rotateRes.body.data.kitchenCode).toBe('CHF-7700');

      const updatedRes = await Reservation.findById(testRes._id);
      expect(updatedRes.manualToken.startsWith('CHF-7700-')).toBe(true);
    });
  });

  describe('3. Meal Safety Lock', () => {
    it('should prevent deleting meal that has upcoming active reservations', async () => {
      const delRes = await request(app)
        .delete(`/api/v1/meals/${testMeal._id}`)
        .set('Authorization', `Bearer ${chefToken}`);

      expect(delRes.status).toBe(400);
      expect(delRes.body.message).toContain('active upcoming reservation');
    });
  });

  describe('4. Subscriber Removal by Chef', () => {
    it('should remove subscriber with reason, cancel future reservations, and free capacity', async () => {
      const removeRes = await request(app)
        .patch(`/api/v1/chefs/subscribers/${testSub._id}/remove`)
        .set('Authorization', `Bearer ${chefToken}`)
        .send({ reason: 'Kitchen relocating to another locality next week.' });

      expect(removeRes.status).toBe(200);

      const updatedSub = await Subscription.findById(testSub._id);
      expect(updatedSub.status).toBe('cancelled_by_chef');
      expect(updatedSub.removalReason).toBe('Kitchen relocating to another locality next week.');

      const updatedRes = await Reservation.findById(testRes._id);
      expect(updatedRes.status).toBe('cancelled');
    });
  });

  describe('5. Complaints from Both Roles', () => {
    it('should allow customer to file complaint against chef', async () => {
      const res = await request(app)
        .post('/api/v1/complaints')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          againstId: chefUser._id,
          category: 'food_quality',
          description: 'Food was too spicy compared to mild profile.'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.complaint.reporterRole).toBe('customer');
    });

    it('should allow chef to file complaint against customer', async () => {
      const res = await request(app)
        .post('/api/v1/complaints')
        .set('Authorization', `Bearer ${chefToken}`)
        .send({
          againstId: customerUser._id,
          category: 'no_show',
          description: 'Customer did not show up during pickup window.'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.complaint.reporterRole).toBe('chef');
    });
  });

  describe('6. Admin Endpoints with Live Counts & Filter', () => {
    it('should filter pending chefs by status parameter', async () => {
      const res = await request(app)
        .get('/api/v1/admin/chefs/pending?status=approved')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.chefs.length).toBeGreaterThanOrEqual(1);
    });

    it('should return areas with live dynamic counts', async () => {
      const res = await request(app)
        .get('/api/v1/admin/areas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.areas[0]).toHaveProperty('approvedChefsCount');
      expect(res.body.data.areas[0]).toHaveProperty('openKitchensCount');
      expect(res.body.data.areas[0]).toHaveProperty('waitingListSize');
    });
  });

  describe('7. Geocoding Proxy', () => {
    it('should return 200 on /api/v1/geo/search even with short or empty query', async () => {
      const res = await request(app).get('/api/v1/geo/search?q=a');
      expect(res.status).toBe(200);
      expect(res.body.data.results).toEqual([]);
    });

    it('should validate coordinates on /api/v1/geo/reverse', async () => {
      const badRes = await request(app).get('/api/v1/geo/reverse');
      expect(badRes.status).toBe(400);

      const goodRes = await request(app).get('/api/v1/geo/reverse?lat=12.9719&lng=77.6408');
      expect(goodRes.status).toBe(200);
      expect(goodRes.body.data.location).toHaveProperty('displayName');
    });
  });
});
