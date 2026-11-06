const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('customer'));

router.get('/favorites', customerController.getFavorites);
router.post('/favorites/:chefId', customerController.addFavorite);
router.delete('/favorites/:chefId', customerController.removeFavorite);
router.get('/history', customerController.getHistory);

module.exports = router;
