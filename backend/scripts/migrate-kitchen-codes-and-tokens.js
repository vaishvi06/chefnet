const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/models/userModel');
const Reservation = require('../src/models/reservationModel');

const generateRandomSuffix = () => Math.floor(1000 + Math.random() * 9000);

const generateKitchenCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CHF-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const runMigration = async () => {
  try {
    console.log('[Migration] Connecting to MongoDB:', env.MONGO_URI);
    await mongoose.connect(env.MONGO_URI);
    console.log('[Migration] Connected.');

    // 1. Migrate Chef Kitchen Codes
    const chefsWithoutCode = await User.find({
      role: 'chef',
      $or: [
        { 'chefProfile.kitchenCode': { $exists: false } },
        { 'chefProfile.kitchenCode': null },
        { 'chefProfile.kitchenCode': '' }
      ]
    });

    console.log(`[Migration] Found ${chefsWithoutCode.length} chef(s) needing a kitchen code.`);
    let migratedChefs = 0;
    const usedCodes = new Set(
      (await User.distinct('chefProfile.kitchenCode', { role: 'chef' })).filter(Boolean)
    );

    for (const chef of chefsWithoutCode) {
      if (!chef.chefProfile) chef.chefProfile = {};
      let newCode;
      do {
        newCode = generateKitchenCode();
      } while (usedCodes.has(newCode));

      usedCodes.add(newCode);
      chef.chefProfile.kitchenCode = newCode;
      chef.chefProfile.kitchenCodeUpdatedAt = new Date();
      await chef.save({ validateBeforeSave: false });
      migratedChefs++;
      console.log(`[Migration] Assigned code "${newCode}" to chef "${chef.name}" (${chef._id})`);
    }

    // 2. Migrate Reservation Manual Tokens
    const reservationsWithoutToken = await Reservation.find({
      $or: [
        { manualToken: { $exists: false } },
        { manualToken: null },
        { manualToken: '' }
      ]
    }).populate('chef', 'chefProfile.kitchenCode name');

    console.log(`[Migration] Found ${reservationsWithoutToken.length} reservation(s) needing a manual pickup token.`);
    let migratedReservations = 0;

    for (const resv of reservationsWithoutToken) {
      const kCode = resv.chef?.chefProfile?.kitchenCode || 'CHF-8888';
      const manualToken = `${kCode}-${generateRandomSuffix()}`;
      resv.manualToken = manualToken;
      await resv.save({ validateBeforeSave: false });
      migratedReservations++;
    }

    // 3. Ensure and sync indexes
    console.log('[Migration] Syncing database indexes...');
    await Promise.all([
      User.syncIndexes(),
      Reservation.syncIndexes()
    ]);

    console.log('--------------------------------------------------');
    console.log('[Migration Completed Successfully]');
    console.log(`  - Chefs updated: ${migratedChefs}`);
    console.log(`  - Reservations updated: ${migratedReservations}`);
    console.log('  - Indexes synced.');
    console.log('--------------------------------------------------');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('[Migration Error]:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
};

runMigration();

