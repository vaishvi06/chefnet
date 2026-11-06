const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', mealController.getMeals);
router.get('/:id', mealController.getMealById);

router.post(
  '/',
  authenticate,
  authorize('chef', 'admin'),
  upload.single('photo'),
  mealController.createMeal
);

router.patch(
  '/:id',
  authenticate,
  authorize('chef', 'admin'),
  upload.single('photo'),
  mealController.updateMeal
);

router.patch(
  '/:id/pause',
  authenticate,
  authorize('chef', 'admin'),
  mealController.togglePauseMeal
);

router.delete(
  '/:id',
  authenticate,
  authorize('chef', 'admin'),
  mealController.deleteMeal
);

module.exports = router;
