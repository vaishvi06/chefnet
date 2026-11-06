const express = require('express');
const router = express.Router();
const chefController = require('../controllers/chefController');
const { authenticate, authorize } = require('../middleware/auth');

const reviewController = require('../controllers/reviewController');

// Public chef reviews route
router.get('/:id/reviews', reviewController.getChefReviews);

router.use(authenticate, authorize('chef'));

router.post('/register-kitchen', chefController.registerKitchen);
router.patch('/availability', chefController.updateAvailability);
router.post('/vacation', chefController.addVacation);
router.get('/dashboard/analytics', chefController.getDashboardAnalytics);
router.get('/reservations', chefController.getChefReservations);

// Kitchen queue, Kitchen code rotation & Subscriber management
router.get('/queue', chefController.getKitchenQueue);
router.patch('/me/kitchen-code', chefController.updateKitchenCode);
router.get('/subscribers', chefController.getChefSubscribers);
router.patch('/subscribers/:subscriptionId/remove', chefController.removeSubscriber);

module.exports = router;
