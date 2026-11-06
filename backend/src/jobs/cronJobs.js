const cron = require('node-cron');
const Reservation = require('../models/reservationModel');
const Subscription = require('../models/subscriptionModel');
const DailyMenu = require('../models/dailyMenuModel');
const User = require('../models/userModel');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');
const { calculateTrustScore } = require('../utils/trustScore');
const env = require('../config/env');

/**
 * Initialize all automated platform cron jobs in Asia/Kolkata timezone
 */
const initCronJobs = () => {
  const cronOptions = {
    timezone: env.TZ || 'Asia/Kolkata'
  };

  /**
   * 1. Mark 'ready' reservations as missed after pickup window passes
   * Runs every 15 minutes
   */
  cron.schedule(
    '*/15 * * * *',
    async () => {
      try {
        const now = new Date();
        const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Find reservations that are 'ready' on today or earlier
        const readyReservations = await Reservation.find({
          status: 'ready',
          reserveDate: { $lte: todayDate }
        }).populate('dailyMenu meal');

        for (const res of readyReservations) {
          let hasPickupWindowPassed = false;

          // Check if date is strictly before today
          if (res.reserveDate < todayDate) {
            hasPickupWindowPassed = true;
          } else if (res.dailyMenu && res.dailyMenu.pickupEnd) {
            // Check pickupEnd time string (e.g. "14:00")
            const parts = res.dailyMenu.pickupEnd.split(':');
            if (parts.length >= 2) {
              const endHour = parseInt(parts[0], 10);
              const endMinute = parseInt(parts[1], 10);
              const currentHour = now.getHours();
              const currentMinute = now.getMinutes();

              if (currentHour > endHour || (currentHour === endHour && currentMinute > endMinute)) {
                hasPickupWindowPassed = true;
              }
            }
          }

          if (hasPickupWindowPassed) {
            res.status = 'missed';
            res.isMissed = true;
            await res.save();

            // Update customer missedPickupCount and recalculate trust score
            const customer = await User.findById(res.customer);
            if (customer) {
              customer.missedPickupCount += 1;

              const [totalRes, pickedUpRes, missedRes, cancelledRes] = await Promise.all([
                Reservation.countDocuments({ customer: customer._id }),
                Reservation.countDocuments({ customer: customer._id, status: 'picked_up' }),
                Reservation.countDocuments({ customer: customer._id, isMissed: true }),
                Reservation.countDocuments({ customer: customer._id, status: 'cancelled' })
              ]);

              customer.trustScore = calculateTrustScore({
                totalReservations: totalRes,
                pickedUpCount: pickedUpRes,
                missedPickupCount: missedRes,
                cancelledCount: cancelledRes,
                ratingAverage: customer.ratingAverage,
                ratingCount: customer.ratingCount
              });

              await customer.save();

              await notificationService.createAndSend({
                userId: customer._id,
                type: 'meal_missed',
                message: `You missed your pickup window for ${res.meal?.name || 'your meal'}. Your trust score has been adjusted.`,
                data: { reservationId: res._id, newTrustScore: customer.trustScore }
              });
            }
          }
        }
      } catch (err) {
        console.error('[Cron Job Error] markMissedPickups:', err.message);
      }
    },
    cronOptions
  );

  /**
   * 2. Send expiry reminders 2 days before subscription endDate
   * Runs daily at 09:00 AM IST
   */
  cron.schedule(
    '0 9 * * *',
    async () => {
      try {
        const inTwoDays = new Date();
        inTwoDays.setDate(inTwoDays.getDate() + 2);
        inTwoDays.setHours(23, 59, 59, 999);

        const inOneDay = new Date();
        inOneDay.setDate(inOneDay.getDate() + 1);
        inOneDay.setHours(0, 0, 0, 0);

        const expiringSubs = await Subscription.find({
          status: 'active',
          expiryReminderSent: false,
          endDate: { $gte: inOneDay, $lte: inTwoDays }
        }).populate('customer chef');

        for (const sub of expiringSubs) {
          sub.expiryReminderSent = true;
          await sub.save();

          if (sub.customer && sub.customer.email) {
            await emailService.sendSubscriptionExpiryReminder(sub.customer.email, 2);
          }

          await notificationService.createAndSend({
            userId: sub.customer._id,
            type: 'subscription_expiry',
            message: `Your ${sub.planType} subscription for ${sub.mealPlan} with ${sub.chef?.name || 'your chef'} is expiring in 2 days.`,
            data: { subscriptionId: sub._id }
          });
        }
      } catch (err) {
        console.error('[Cron Job Error] sendExpiryReminders:', err.message);
      }
    },
    cronOptions
  );

  /**
   * 3. Send pickup deadline reminders for meals ready for pickup
   * Runs every 30 minutes
   */
  cron.schedule(
    '*/30 * * * *',
    async () => {
      try {
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);

        const activePickups = await Reservation.find({
          status: 'ready',
          reserveDate: { $gte: todayDate }
        }).populate('meal dailyMenu');

        for (const res of activePickups) {
          await notificationService.createAndSend({
            userId: res.customer,
            type: 'pickup_reminder',
            message: `Pickup reminder: Your delicious ${res.meal?.name || 'meal'} is waiting for pickup (window ends at ${res.dailyMenu?.pickupEnd || 'scheduled time'}).`,
            data: { reservationId: res._id }
          });
        }
      } catch (err) {
        console.error('[Cron Job Error] sendPickupReminders:', err.message);
      }
    },
    cronOptions
  );

  /**
   * 4. Mark expired subscriptions and restore chef capacity
   * Runs every hour
   */
  cron.schedule(
    '0 * * * *',
    async () => {
      try {
        const now = new Date();
        const expiredSubs = await Subscription.find({
          status: 'active',
          endDate: { $lt: now }
        });

        for (const sub of expiredSubs) {
          sub.status = 'expired';
          await sub.save();

          // Check chef availability to reopen slots if capacity was full
          const chef = await User.findById(sub.chef);
          if (chef && chef.chefProfile?.availabilityStatus === 'full') {
            const activeCount = await Subscription.countDocuments({
              chef: chef._id,
              status: 'active'
            });
            const maxSubs = chef.chefProfile?.maxSubscribers || 15;
            if (activeCount < maxSubs) {
              chef.chefProfile.availabilityStatus =
                activeCount >= Math.floor(maxSubs * 0.8) ? 'limited' : 'accepting';
              await chef.save();
            }
          }
        }
      } catch (err) {
        console.error('[Cron Job Error] markExpiredSubscriptions:', err.message);
      }
    },
    cronOptions
  );

  console.log(`[Cron Jobs] Platform automated tasks scheduled in timezone: ${cronOptions.timezone}`);
};

module.exports = {
  initCronJobs
};
