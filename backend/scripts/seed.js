const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('../src/config/env');
const User = require('../src/models/userModel');
const Area = require('../src/models/areaModel');
const Meal = require('../src/models/mealModel');
const DailyMenu = require('../src/models/dailyMenuModel');
const Subscription = require('../src/models/subscriptionModel');
const Reservation = require('../src/models/reservationModel');
const Review = require('../src/models/reviewModel');
const Complaint = require('../src/models/complaintModel');
const WaitingListEntry = require('../src/models/waitingListModel');
const qrService = require('../src/services/qrService');

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB:', env.MONGO_URI);
    await mongoose.connect(env.MONGO_URI);
    console.log('[Seed] Connected. Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      Area.deleteMany({}),
      Meal.deleteMany({}),
      DailyMenu.deleteMany({}),
      Subscription.deleteMany({}),
      Reservation.deleteMany({}),
      Review.deleteMany({}),
      Complaint.deleteMany({}),
      WaitingListEntry.deleteMany({})
    ]);

    const defaultPassword = 'Password123#Secure';
    const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
    const commonPasswordHash = await bcrypt.hash(defaultPassword, salt);
    const adminPasswordHash = await bcrypt.hash(env.ADMIN_PASSWORD, salt);

    console.log('[Seed] 1. Creating Areas...');
    // Area 1: Bellandur Green Glen (Active)
    const bellandurArea = await Area.create({
      name: 'Bellandur Green Glen Locality',
      type: 'locality',
      center: {
        type: 'Point',
        coordinates: [77.6741, 12.9279]
      },
      radiusInMeters: 2500,
      isActive: true,
      demandCount: 12,
      activationThreshold: 3
    });

    // Area 2: HSR Layout Sector 2 (Waiting/Active)
    const hsrArea = await Area.create({
      name: 'HSR Layout Sector 2',
      type: 'sector',
      center: {
        type: 'Point',
        coordinates: [77.6515, 12.9116]
      },
      radiusInMeters: 2500,
      isActive: true,
      demandCount: 8,
      activationThreshold: 2
    });

    // Area 3: Koramangala 4th Block (Pending/Inactive)
    const koramangalaArea = await Area.create({
      name: 'Koramangala 4th Block',
      type: 'locality',
      center: {
        type: 'Point',
        coordinates: [77.6229, 12.9345]
      },
      radiusInMeters: 2500,
      isActive: false,
      demandCount: 14,
      activationThreshold: 4
    });

    // Area 4: Indiranagar 100ft Corridor (Pending/Inactive)
    const indiranagarArea = await Area.create({
      name: 'Indiranagar 100ft Corridor',
      type: 'locality',
      center: {
        type: 'Point',
        coordinates: [77.6408, 12.9719]
      },
      radiusInMeters: 2500,
      isActive: false,
      demandCount: 9,
      activationThreshold: 5
    });

    console.log('[Seed] 2. Creating Admin User...');
    const adminUser = await User.create({
      name: env.ADMIN_NAME,
      email: env.ADMIN_EMAIL,
      passwordHash: adminPasswordHash,
      role: 'admin',
      isEmailVerified: true,
      isLocationVerified: true,
      phone: '+919999900000',
      address: 'ChiefNet Operations HQ, Bellandur, Bengaluru',
      location: {
        type: 'Point',
        coordinates: [77.6741, 12.9279]
      },
      area: bellandurArea._id
    });

    console.log('[Seed] 3. Creating 6 Verified Home Chefs...');
    const chefsData = [
      {
        name: 'Smt. Shanti Devi',
        email: 'shanti.devi@chiefnet.test',
        phone: '+919811122201',
        address: 'Villa 14, Green Glen Layout, Bellandur, Bengaluru',
        location: { type: 'Point', coordinates: [77.6743, 12.9281] },
        area: bellandurArea._id,
        ratingAverage: 4.9,
        ratingCount: 18,
        trustScore: 98,
        chefProfile: {
          kitchenName: "Shanti's Traditional Gujarati Rasoi",
          operatingHours: '07:30 - 21:30',
          isVerified: true,
          verificationStatus: 'approved',
          dailyCapacity: 25,
          maxSubscribers: 18,
          availabilityStatus: 'accepting'
        }
      },
      {
        name: 'Chef Gurpreet Singh',
        email: 'gurpreet.singh@chiefnet.test',
        phone: '+919811122202',
        address: 'B-201, Sobha Carnation, Bellandur, Bengaluru',
        location: { type: 'Point', coordinates: [77.6738, 12.9275] },
        area: bellandurArea._id,
        ratingAverage: 4.8,
        ratingCount: 14,
        trustScore: 96,
        chefProfile: {
          kitchenName: 'Punjab Di Shaan Home Kitchen',
          operatingHours: '08:00 - 22:00',
          isVerified: true,
          verificationStatus: 'approved',
          dailyCapacity: 30,
          maxSubscribers: 20,
          availabilityStatus: 'accepting'
        }
      },
      {
        name: 'Meenakshi Amma',
        email: 'meenakshi.amma@chiefnet.test',
        phone: '+919811122203',
        address: '304, Palm Retreat, Bellandur, Bengaluru',
        location: { type: 'Point', coordinates: [77.6745, 12.9285] },
        area: bellandurArea._id,
        ratingAverage: 5.0,
        ratingCount: 22,
        trustScore: 100,
        chefProfile: {
          kitchenName: 'Dakshin Authentic Homemade Delights',
          operatingHours: '07:00 - 20:30',
          isVerified: true,
          verificationStatus: 'approved',
          dailyCapacity: 20,
          maxSubscribers: 15,
          availabilityStatus: 'accepting'
        }
      },
      {
        name: 'Kavita Patel',
        email: 'kavita.patel@chiefnet.test',
        phone: '+919811122204',
        address: '12, Sunrise Residency, Bellandur, Bengaluru',
        location: { type: 'Point', coordinates: [77.6739, 12.927] },
        area: bellandurArea._id,
        ratingAverage: 4.7,
        ratingCount: 9,
        trustScore: 94,
        chefProfile: {
          kitchenName: "Kavita's Budget Student Meals & Tiffins",
          operatingHours: '08:00 - 21:00',
          isVerified: true,
          verificationStatus: 'approved',
          dailyCapacity: 35,
          maxSubscribers: 25,
          availabilityStatus: 'accepting'
        }
      },
      {
        name: 'Chef Rajesh Kumar',
        email: 'rajesh.fit@chiefnet.test',
        phone: '+919811122205',
        address: '54, 14th Main, Sector 2, HSR Layout, Bengaluru',
        location: { type: 'Point', coordinates: [77.6518, 12.9118] },
        area: hsrArea._id,
        ratingAverage: 4.9,
        ratingCount: 16,
        trustScore: 97,
        chefProfile: {
          kitchenName: 'FitBites Healthy Diet & High Protein',
          operatingHours: '07:00 - 20:00',
          isVerified: true,
          verificationStatus: 'approved',
          dailyCapacity: 20,
          maxSubscribers: 15,
          availabilityStatus: 'accepting'
        }
      },
      {
        name: 'Anita Deshmukh',
        email: 'anita.deshmukh@chiefnet.test',
        phone: '+919811122206',
        address: '88, 19th Cross, Sector 2, HSR Layout, Bengaluru',
        location: { type: 'Point', coordinates: [77.6512, 12.9114] },
        area: hsrArea._id,
        ratingAverage: 4.8,
        ratingCount: 11,
        trustScore: 95,
        chefProfile: {
          kitchenName: 'Annapurna Maharashtrian & North Indian Homestyle',
          operatingHours: '07:30 - 21:30',
          isVerified: true,
          verificationStatus: 'approved',
          dailyCapacity: 25,
          maxSubscribers: 18,
          availabilityStatus: 'accepting'
        }
      }
    ];

    const chefs = [];
    let chefCodeCounter = 1001;
    for (const data of chefsData) {
      if (!data.chefProfile.kitchenCode) {
        data.chefProfile.kitchenCode = `CHF-${chefCodeCounter++}`;
      }
      const chef = await User.create({
        ...data,
        passwordHash: commonPasswordHash,
        role: 'chef',
        isEmailVerified: true,
        isLocationVerified: true
      });
      chefs.push(chef);
    }

    console.log('[Seed] 3b. Creating 6 Pending Home Chefs awaiting admin verification...');
    const pendingChefsData = [
      {
        name: 'Meenakshi Sundaram',
        email: 'meenakshi.chef@chiefnet.test',
        phone: '+919811122301',
        address: '15, 7th Cross, Green Glen Layout, Bellandur, Bengaluru',
        location: { type: 'Point', coordinates: [77.6748, 12.9288] },
        area: bellandurArea._id,
        chefProfile: {
          kitchenName: "Meenakshi's Chettinad Kitchen",
          description: 'Authentic Chettinad and Kongu cuisine cooked in clay pots with hand-ground spices.',
          kitchenCode: 'CHF-2001',
          operatingHours: '08:00 - 21:00',
          isVerified: false,
          verificationStatus: 'pending',
          dailyCapacity: 20,
          maxSubscribers: 15,
          availabilityStatus: 'accepting'
        }
      },
      {
        name: 'Rajeshwari Nair',
        email: 'rajeshwari.chef@chiefnet.test',
        phone: '+919811122302',
        address: '77, 5th Main, Sector 2, HSR Layout, Bengaluru',
        location: { type: 'Point', coordinates: [77.6522, 12.9122] },
        area: hsrArea._id,
        chefProfile: {
          kitchenName: 'Malabar Traditional Homestyle',
          description: 'Kerala traditional meals with brown rice, authentic sambar, thoran and payasam.',
          kitchenCode: 'CHF-2002',
          operatingHours: '07:30 - 20:30',
          isVerified: false,
          verificationStatus: 'pending',
          dailyCapacity: 25,
          maxSubscribers: 18,
          availabilityStatus: 'accepting'
        }
      },
      {
        name: 'Vandana Kulkarni',
        email: 'vandana.chef@chiefnet.test',
        phone: '+919811122303',
        address: '42, 8th Block, Koramangala, Bengaluru',
        location: { type: 'Point', coordinates: [77.6235, 12.9348] },
        area: koramangalaArea._id,
        chefProfile: {
          kitchenName: 'Kulkarni Maharashtrian Poli Bhaji Kendra',
          description: 'Homestyle puran poli, pitla bhakri, and comforting varan bhaat.',
          kitchenCode: 'CHF-2003',
          operatingHours: '08:00 - 20:00',
          isVerified: false,
          verificationStatus: 'pending',
          dailyCapacity: 15,
          maxSubscribers: 12,
          availabilityStatus: 'accepting'
        }
      },
      {
        name: 'Farzana Begum',
        email: 'farzana.chef@chiefnet.test',
        phone: '+919811122304',
        address: '102, 4th Block, Koramangala, Bengaluru',
        location: { type: 'Point', coordinates: [77.6215, 12.9338] },
        area: koramangalaArea._id,
        chefProfile: {
          kitchenName: "Farzana's Dakhni Homestyle Zaika",
          description: 'Aromatic Lucknowi and Hyderabadi veg and non-veg curries cooked with grandma recipes.',
          kitchenCode: 'CHF-2004',
          operatingHours: '09:00 - 22:00',
          isVerified: false,
          verificationStatus: 'pending',
          dailyCapacity: 30,
          maxSubscribers: 20,
          availabilityStatus: 'accepting'
        }
      },
      {
        name: 'Nirmala Joshi',
        email: 'nirmala.chef@chiefnet.test',
        phone: '+919811122305',
        address: '210, 100ft Road, Indiranagar, Bengaluru',
        location: { type: 'Point', coordinates: [77.6412, 12.9725] },
        area: indiranagarArea._id,
        chefProfile: {
          kitchenName: 'Satvik Rasoi & Diet Kitchen',
          description: 'Zero onion zero garlic completely Satvik healthy meals prepared with pure ghee.',
          kitchenCode: 'CHF-2005',
          operatingHours: '07:00 - 19:30',
          isVerified: false,
          verificationStatus: 'pending',
          dailyCapacity: 20,
          maxSubscribers: 15,
          availabilityStatus: 'accepting'
        }
      },
      {
        name: 'Gurunath Rao',
        email: 'gurunath.chef@chiefnet.test',
        phone: '+919811122306',
        address: '89, 12th Main, Indiranagar, Bengaluru',
        location: { type: 'Point', coordinates: [77.6402, 12.9712] },
        area: indiranagarArea._id,
        chefProfile: {
          kitchenName: 'Udupi Brahamana Oota',
          description: 'Traditional Udupi meals with saaru, huli, kootu and steamed rice.',
          kitchenCode: 'CHF-2006',
          operatingHours: '07:30 - 21:00',
          isVerified: false,
          verificationStatus: 'pending',
          dailyCapacity: 25,
          maxSubscribers: 18,
          availabilityStatus: 'accepting'
        }
      }
    ];

    for (const data of pendingChefsData) {
      await User.create({
        ...data,
        passwordHash: commonPasswordHash,
        role: 'chef',
        isEmailVerified: true,
        isLocationVerified: true
      });
    }

    console.log('[Seed] 3c. Creating 1 Rejected Chef for verification queue history...');
    await User.create({
      name: 'Devendra Singh',
      email: 'devendra.chef@chiefnet.test',
      phone: '+919811122399',
      address: '77, Slum Road, Bellandur, Bengaluru',
      location: { type: 'Point', coordinates: [77.6710, 12.9250] },
      area: bellandurArea._id,
      passwordHash: commonPasswordHash,
      role: 'chef',
      isEmailVerified: true,
      isLocationVerified: true,
      chefProfile: {
        kitchenName: "Devendra's Fast Food & Dhaba",
        description: 'Street-style food and commercial snacks.',
        kitchenCode: 'CHF-2099',
        operatingHours: '10:00 - 23:00',
        isVerified: false,
        verificationStatus: 'rejected',
        rejectionReason: 'Kitchen premises failed hygiene check during physical verification. Commercial restaurant setup not allowed on home chef tier.',
        dailyCapacity: 10,
        maxSubscribers: 5,
        availabilityStatus: 'paused'
      }
    });

    console.log('[Seed] 4. Creating Meals for Chefs...');
    const allMeals = [];
    const mealsSeedConfig = [
      // Shanti Devi meals (Gujarati & Jain)
      {
        chef: chefs[0]._id,
        name: 'Kathiyawadi Thali with Bajra Rotla',
        description: 'Authentic Kathiyawadi Sev Tameta, Ringna No Olo, 2 fresh hot Bajra Rotlas with white butter and jaggery',
        price: 130,
        category: 'gujarati',
        mealType: 'lunch',
        isVeg: true,
        isJain: false
      },
      {
        chef: chefs[0]._id,
        name: 'Poha & Jalebi Breakfast Special',
        description: 'Indori style nylon poha garnished with roasted peanuts, sev, pomegranate and fresh warm crispy jalebi',
        price: 70,
        category: 'gujarati',
        mealType: 'breakfast',
        isVeg: true,
        isJain: false
      },
      {
        chef: chefs[0]._id,
        name: 'Pure Jain Dal Dhokli & Rice',
        description: 'Traditional Gujarati sweet and tangy toor dal simmered with spiced whole wheat dumplings without onion/garlic',
        price: 110,
        category: 'jain',
        mealType: 'dinner',
        isVeg: true,
        isJain: true
      },

      // Gurpreet Singh meals (Punjabi)
      {
        chef: chefs[1]._id,
        name: 'Dal Makhani & Paneer Butter Masala Thali',
        description: 'Slow-cooked black lentils overnight with fresh cream, soft cottage cheese curry, and 3 butter phulkas',
        price: 160,
        category: 'punjabi',
        mealType: 'lunch',
        isVeg: true,
        isJain: false
      },
      {
        chef: chefs[1]._id,
        name: 'Amritsari Aloo Paratha with Curd & Pickle',
        description: 'Two large tawa roasted potato stuffed parathas served with homemade curd and mango pickle',
        price: 90,
        category: 'punjabi',
        mealType: 'breakfast',
        isVeg: true,
        isJain: false
      },
      {
        chef: chefs[1]._id,
        name: 'Rajma Chawal Homestyle Comfort Meal',
        description: 'Delicious Jammu rajma simmered in fragrant spices served over piping hot jeera basmati rice',
        price: 120,
        category: 'punjabi',
        mealType: 'dinner',
        isVeg: true,
        isJain: false
      },

      // Meenakshi Amma meals (South Indian)
      {
        chef: chefs[2]._id,
        name: 'Traditional Tamil Sambar Rice & Poriyal',
        description: 'Steaming hot toor dal sambar mixed with ponni rice, potato podimas, appalam, and ginger rasam',
        price: 100,
        category: 'south_indian',
        mealType: 'lunch',
        isVeg: true,
        isJain: false
      },
      {
        chef: chefs[2]._id,
        name: 'Soft Ghee Podi Idli (4 pcs) & Medu Vada (1 pc)',
        description: 'Melt-in-mouth steamed idlis tossed in gun powder ghee, served with coconut chutney and piping hot sambar',
        price: 80,
        category: 'south_indian',
        mealType: 'breakfast',
        isVeg: true,
        isJain: false
      },

      // Kavita Patel meals (Student Budget)
      {
        chef: chefs[3]._id,
        name: 'Student Daily Super Thali',
        description: 'Yellow dal tadka, seasonal aloo gobi sabzi, 4 soft rotis, steamed rice, and salad. Nutritious and affordable!',
        price: 85,
        category: 'student_budget',
        mealType: 'lunch',
        isVeg: true,
        isJain: false
      },

      // Rajesh Kumar meals (Healthy Diet)
      {
        chef: chefs[4]._id,
        name: 'Quinoa Paneer Power Protein Bowl',
        description: 'Organic rainbow quinoa, 100g pan-seared paneer cubes, roasted broccoli, bell peppers, lemon herb dressing',
        price: 190,
        category: 'healthy_diet',
        mealType: 'lunch',
        isVeg: true,
        isJain: false
      },

      // Anita Deshmukh meals
      {
        chef: chefs[5]._id,
        name: 'Puran Poli & Katachi Amti Festivity Meal',
        description: '2 whole wheat sweet chana dal poli served with spicy chana broth amti and fragrant basmati rice',
        price: 140,
        category: 'punjabi',
        mealType: 'lunch',
        isVeg: true,
        isJain: false
      }
    ];

    for (const m of mealsSeedConfig) {
      const meal = await Meal.create(m);
      allMeals.push(meal);
    }

    console.log('[Seed] 5. Creating Daily Menus for Today & Tomorrow...');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dailyMenus = [];

    // Menus for Chef 1 (Shanti Devi)
    const m1 = await DailyMenu.create({
      chef: chefs[0]._id,
      menuDate: today,
      mealType: 'lunch',
      meals: [allMeals[0]._id],
      pickupStart: '12:30',
      pickupEnd: '14:30',
      cutoffTime: new Date(today.getTime() + 12 * 60 * 60 * 1000), // 12:00 PM today
      quantityAvailable: 15
    });
    dailyMenus.push(m1);

    const m2 = await DailyMenu.create({
      chef: chefs[0]._id,
      menuDate: tomorrow,
      mealType: 'lunch',
      meals: [allMeals[0]._id],
      pickupStart: '12:30',
      pickupEnd: '14:30',
      cutoffTime: new Date(tomorrow.getTime() + 11 * 60 * 60 * 1000),
      quantityAvailable: 20
    });
    dailyMenus.push(m2);

    // Menus for Chef 2 (Gurpreet Singh)
    const m3 = await DailyMenu.create({
      chef: chefs[1]._id,
      menuDate: today,
      mealType: 'lunch',
      meals: [allMeals[3]._id],
      pickupStart: '13:00',
      pickupEnd: '15:00',
      cutoffTime: new Date(today.getTime() + 12 * 60 * 60 * 1000),
      quantityAvailable: 18
    });
    dailyMenus.push(m3);

    console.log('[Seed] 6. Creating 5 Customers within 1 km pickup radius...');
    const customersData = [
      {
        name: 'Rohan Sharma',
        email: 'rohan.customer@chiefnet.test',
        phone: '+919988776601',
        address: 'Tower 4, Green Glen Layout, Bellandur, Bengaluru',
        location: { type: 'Point', coordinates: [77.6742, 12.928] }, // ~50m from Shanti Devi
        area: bellandurArea._id,
        trustScore: 100,
        customerProfile: { dietaryPreference: 'veg', favorites: [chefs[0]._id, chefs[1]._id] }
      },
      {
        name: 'Aakash Verma',
        email: 'aakash.verma@chiefnet.test',
        phone: '+919988776602',
        address: 'B-102, Sobha Carnation, Bellandur, Bengaluru',
        location: { type: 'Point', coordinates: [77.6744, 12.9277] }, // ~120m from chefs
        area: bellandurArea._id,
        trustScore: 98,
        customerProfile: { dietaryPreference: 'all', favorites: [chefs[1]._id] }
      },
      {
        name: 'Sneha Iyer',
        email: 'sneha.iyer@chiefnet.test',
        phone: '+919988776603',
        address: 'Block C, Palm Retreat, Bellandur, Bengaluru',
        location: { type: 'Point', coordinates: [77.6735, 12.9282] }, // ~150m from chefs
        area: bellandurArea._id,
        trustScore: 100,
        customerProfile: { dietaryPreference: 'veg', favorites: [chefs[2]._id] }
      },
      {
        name: 'Vikram Malhotra',
        email: 'vikram.m@chiefnet.test',
        phone: '+919988776604',
        address: 'Plot 32, 14th Main, Sector 2, HSR Layout, Bengaluru',
        location: { type: 'Point', coordinates: [77.6516, 12.9117] }, // ~40m from Rajesh Kumar
        area: hsrArea._id,
        trustScore: 95,
        customerProfile: { dietaryPreference: 'all', favorites: [chefs[4]._id] }
      },
      {
        name: 'Pooja Hegde',
        email: 'pooja.h@chiefnet.test',
        phone: '+919988776605',
        address: 'Flat 202, 19th Cross, Sector 2, HSR Layout, Bengaluru',
        location: { type: 'Point', coordinates: [77.6514, 12.9115] }, // ~30m from Anita
        area: hsrArea._id,
        trustScore: 100,
        customerProfile: { dietaryPreference: 'veg', favorites: [chefs[5]._id] }
      },
      {
        name: 'Arjun Rao',
        email: 'arjun.rao@chiefnet.test',
        phone: '+919988776606',
        address: '88, 4th Block, Koramangala, Bengaluru',
        location: { type: 'Point', coordinates: [77.6225, 12.9342] },
        area: koramangalaArea._id,
        trustScore: 100,
        customerProfile: { dietaryPreference: 'all', favorites: [] }
      },
      {
        name: 'Divya Nambiar',
        email: 'divya.n@chiefnet.test',
        phone: '+919988776607',
        address: '14, 100ft Road, Indiranagar, Bengaluru',
        location: { type: 'Point', coordinates: [77.6405, 12.9715] },
        area: indiranagarArea._id,
        trustScore: 100,
        customerProfile: { dietaryPreference: 'veg', favorites: [] }
      }
    ];

    const customers = [];
    for (const cust of customersData) {
      const user = await User.create({
        ...cust,
        passwordHash: commonPasswordHash,
        role: 'customer',
        isEmailVerified: true,
        isLocationVerified: true
      });
      customers.push(user);
    }

    console.log('[Seed] 7. Creating Sample Subscriptions...');
    // Active subscription: Rohan -> Shanti Devi (weekly lunch)
    const sub1 = await Subscription.create({
      customer: customers[0]._id,
      chef: chefs[0]._id,
      planType: 'weekly',
      mealPlan: 'lunch',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    // Active subscription: Aakash -> Gurpreet Singh (monthly lunch)
    const sub2 = await Subscription.create({
      customer: customers[1]._id,
      chef: chefs[1]._id,
      planType: 'monthly',
      mealPlan: 'lunch',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    // Pending subscription: Sneha -> Shanti Devi (weekly dinner)
    const sub3 = await Subscription.create({
      customer: customers[2]._id,
      chef: chefs[0]._id,
      planType: 'weekly',
      mealPlan: 'dinner',
      status: 'pending',
      startDate: new Date()
    });

    console.log('[Seed] 8. Creating Sample Reservations & Pickup QR Tokens...');
    const resDate = today;

    // Reservation 1: Rohan Sharma (Ready for pickup)
    const tempResId1 = new mongoose.Types.ObjectId();
    const qrToken1 = qrService.generateSignedToken({
      reservationId: tempResId1,
      customerId: customers[0]._id,
      chefId: chefs[0]._id,
      mealType: 'lunch',
      reserveDate: resDate
    });

    const res1 = await Reservation.create({
      _id: tempResId1,
      subscription: sub1._id,
      customer: customers[0]._id,
      chef: chefs[0]._id,
      dailyMenu: m1._id,
      meal: allMeals[0]._id,
      reserveDate: resDate,
      mealType: 'lunch',
      status: 'ready',
      qrToken: qrToken1,
      manualToken: 'CHF-1001-4412',
      price: allMeals[0].price
    });

    // Reservation 2: Aakash Verma (Picked Up with Review)
    const tempResId2 = new mongoose.Types.ObjectId();
    const qrToken2 = qrService.generateSignedToken({
      reservationId: tempResId2,
      customerId: customers[1]._id,
      chefId: chefs[1]._id,
      mealType: 'lunch',
      reserveDate: resDate
    });

    const res2 = await Reservation.create({
      _id: tempResId2,
      subscription: sub2._id,
      customer: customers[1]._id,
      chef: chefs[1]._id,
      dailyMenu: m3._id,
      meal: allMeals[3]._id,
      reserveDate: resDate,
      mealType: 'lunch',
      status: 'picked_up',
      pickedUpAt: new Date(),
      verifiedAt: new Date(),
      verifiedBy: chefs[1]._id,
      qrToken: qrToken2,
      manualToken: 'CHF-1002-8821',
      price: allMeals[3].price
    });

    // Review on picked up reservation
    await Review.create({
      reservation: res2._id,
      author: customers[1]._id,
      target: chefs[1]._id,
      authorRole: 'customer',
      ratings: {
        foodQuality: 5,
        foodQuantity: 5,
        hygiene: 5,
        overall: 5
      },
      comment: 'Authentic homestyle Dal Makhani and Paneer! Absolutely delicious and super punctual pickup.'
    });

    console.log('[Seed] 9. Creating Complaints (Customer vs Chef, Chef vs Customer)...');
    // Complaint from Customer against Chef
    await Complaint.create({
      raisedBy: customers[0]._id,
      reporterRole: 'customer',
      against: chefs[1]._id,
      reservation: res2._id,
      category: 'food_quality',
      description: 'The meal thali was too oily and differed from the menu description provided.',
      status: 'open'
    });

    // Complaint from Chef against Customer
    await Complaint.create({
      raisedBy: chefs[0]._id,
      reporterRole: 'chef',
      against: customers[2]._id,
      category: 'no_show',
      description: 'Customer repeatedly failed to pick up dinner and did not respond to calls during the designated 19:30-21:00 window.',
      status: 'open'
    });

    console.log('[Seed] 10. Creating Waiting List Entries in Inactive Areas...');
    await WaitingListEntry.create([
      {
        customer: customers[3]._id,
        area: koramangalaArea._id,
        joinedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      },
      {
        customer: customers[4]._id,
        area: koramangalaArea._id,
        joinedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        customer: customers[5]._id,
        area: indiranagarArea._id,
        joinedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ]);

    console.log('===========================================================');
    console.log('         ChiefNet Database Seed Complete!                  ');
    console.log('===========================================================');
    console.log(`Admin User:      ${env.ADMIN_EMAIL} / ${env.ADMIN_PASSWORD}`);
    console.log(`Sample Chef:     ${chefs[0].email} / ${defaultPassword}`);
    console.log(`Sample Customer: ${customers[0].email} / ${defaultPassword}`);
    console.log(`Areas:           ${bellandurArea.name} (Active), ${hsrArea.name} (Active)`);
    console.log(`Verified Chefs:  ${chefs.length} created with regional meals & menus`);
    console.log(`Customers:       ${customers.length} verified within 1 km radius`);
    console.log(`Subscriptions:   Active weekly & monthly plans initialized`);
    console.log(`Reservations:    Ready for pickup & Completed with signed QR tokens`);
    console.log('===========================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
