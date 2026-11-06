const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.patch(
  '/me',
  authenticate,
  upload.single('photo'),
  userController.updateMe
);

router.post(
  '/me/location',
  authenticate,
  userController.updateLocation
);

router.get(
  '/:id/public',
  userController.getPublicProfile
);

module.exports = router;
