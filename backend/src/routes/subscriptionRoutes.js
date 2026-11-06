const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate, authorize, requireEmailVerified } = require('../middleware/auth');

router.use(authenticate);

router.post(
  '/',
  authorize('customer'),
  requireEmailVerified,
  subscriptionController.createSubscription
);

router.get('/', subscriptionController.getSubscriptions);

router.patch(
  '/:id/accept',
  authorize('chef', 'admin'),
  subscriptionController.acceptSubscription
);

router.patch(
  '/:id/reject',
  authorize('chef', 'admin'),
  subscriptionController.rejectSubscription
);

router.patch('/:id/pause', subscriptionController.pauseSubscription);
router.patch('/:id/resume', subscriptionController.resumeSubscription);
router.patch('/:id/cancel', subscriptionController.cancelSubscription);

module.exports = router;
