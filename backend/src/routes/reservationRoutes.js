const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { authenticate, authorize, requireEmailVerified } = require('../middleware/auth');

router.use(authenticate);

router.post(
  '/',
  authorize('customer'),
  requireEmailVerified,
  reservationController.createReservation
);

router.get('/', reservationController.getReservations);

router.patch(
  '/:id/status',
  reservationController.updateReservationStatus
);

router.get(
  '/:id/qr',
  reservationController.getReservationQR
);

router.post(
  '/verify',
  authorize('chef', 'admin'),
  reservationController.verifyReservation
);

router.post(
  '/verify-qr',
  authorize('chef', 'admin'),
  reservationController.verifyReservation
);

module.exports = router;
