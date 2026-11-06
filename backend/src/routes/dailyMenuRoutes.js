const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', mealController.getDailyMenus);
router.get('/:id', mealController.getDailyMenuById);

router.post(
  '/',
  authenticate,
  authorize('chef', 'admin'),
  mealController.createDailyMenu
);

router.patch(
  '/:id',
  authenticate,
  authorize('chef', 'admin'),
  mealController.updateDailyMenu
);

router.delete(
  '/:id',
  authenticate,
  authorize('chef', 'admin'),
  mealController.deleteDailyMenu
);

module.exports = router;
