const Meal = require('../models/mealModel');
const DailyMenu = require('../models/dailyMenuModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');
const { storageService } = require('../services/storageService');

/**
 * Verify chef is approved and location-verified
 */
const verifyChefEligibility = (chef) => {
  if (!chef.isLocationVerified) {
    throw new AppError(
      'Chef gating: You must verify your GPS location before listing meals or creating daily menus.',
      403
    );
  }
  if (chef.chefProfile?.verificationStatus !== 'approved') {
    throw new AppError(
      'Chef gating: Your kitchen must be approved by an administrator before listing meals.',
      403
    );
  }
};

/**
 * Create a new Meal
 */
const createMeal = asyncHandler(async (req, res, next) => {
  const chef = await User.findById(req.user._id);
  verifyChefEligibility(chef);

  const { name, description, price, category, mealType, isVeg, isJain } = req.body;

  let photoUrl = req.body.photoUrl || null;
  if (req.file) {
    photoUrl = await storageService.save(req.file);
  }

  const meal = await Meal.create({
    chef: req.user._id,
    name,
    description,
    price: Number(price),
    category,
    mealType,
    photoUrl,
    isVeg: isVeg === 'true' || isVeg === true,
    isJain: isJain === 'true' || isJain === true
  });

  return sendResponse(res, 201, 'Meal created successfully', { meal });
});

/**
 * List meals with filtering and pagination
 */
const getMeals = asyncHandler(async (req, res, next) => {
  const {
    chef,
    category,
    mealType,
    isVeg,
    isJain,
    isPaused,
    page = 1,
    limit = 10
  } = req.query;

  const query = { isRemoved: false };

  if (chef) query.chef = chef;
  if (category) query.category = category;
  if (mealType) query.mealType = mealType;
  if (isVeg !== undefined) query.isVeg = isVeg === 'true' || isVeg === true;
  if (isJain !== undefined) query.isJain = isJain === 'true' || isJain === true;
  if (isPaused !== undefined) query.isPaused = isPaused === 'true' || isPaused === true;

  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * pageLimit;

  const [meals, total] = await Promise.all([
    Meal.find(query)
      .populate('chef', 'name chefProfile.kitchenName ratingAverage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageLimit),
    Meal.countDocuments(query)
  ]);

  return sendResponse(res, 200, 'Meals fetched successfully', {
    meals,
    pagination: {
      page: pageNum,
      limit: pageLimit,
      total,
      pages: Math.ceil(total / pageLimit) || 1
    }
  });
});

/**
 * Get meal by ID
 */
const getMealById = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findOne({ _id: req.params.id, isRemoved: false }).populate(
    'chef',
    'name chefProfile.kitchenName ratingAverage location address'
  );

  if (!meal) {
    return next(new AppError('Meal not found', 404));
  }

  return sendResponse(res, 200, 'Meal fetched successfully', { meal });
});

/**
 * Update meal details
 */
const updateMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findOne({ _id: req.params.id, isRemoved: false });

  if (!meal) {
    return next(new AppError('Meal not found', 404));
  }

  if (meal.chef.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this meal', 403));
  }

  if (req.file) {
    req.body.photoUrl = await storageService.save(req.file);
  }

  const updatedMeal = await Meal.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  return sendResponse(res, 200, 'Meal updated successfully', { meal: updatedMeal });
});

/**
 * Toggle pause status of a meal
 */
const togglePauseMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findOne({ _id: req.params.id, isRemoved: false });

  if (!meal) {
    return next(new AppError('Meal not found', 404));
  }

  if (meal.chef.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this meal', 403));
  }

  meal.isPaused = req.body.isPaused !== undefined ? req.body.isPaused : !meal.isPaused;
  await meal.save();

  return sendResponse(
    res,
    200,
    `Meal has been ${meal.isPaused ? 'paused' : 'resumed'} successfully`,
    { meal }
  );
});

/**
 * Soft remove a meal
 */
const deleteMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findOne({ _id: req.params.id, isRemoved: false });

  if (!meal) {
    return next(new AppError('Meal not found', 404));
  }

  if (meal.chef.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this meal', 403));
  }

  // Safety lock: check for upcoming active reservations
  const Reservation = require('../models/reservationModel');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeReservationsCount = await Reservation.countDocuments({
    meal: meal._id,
    reserveDate: { $gte: today },
    status: { $in: ['reserved', 'preparing', 'ready'] }
  });

  if (activeReservationsCount > 0) {
    return next(
      new AppError(
        `Cannot delete this meal because it has ${activeReservationsCount} active upcoming reservation(s). Please pause the meal instead to keep past and upcoming records intact.`,
        400
      )
    );
  }

  meal.isRemoved = true;
  await meal.save();

  return sendResponse(res, 200, 'Meal removed successfully');
});

// ==========================================
// DAILY MENU CONTROLLERS
// ==========================================

/**
 * Create or publish a Daily Menu
 */
const createDailyMenu = asyncHandler(async (req, res, next) => {
  const chef = await User.findById(req.user._id);
  verifyChefEligibility(chef);

  const {
    menuDate,
    mealType,
    meals,
    pickupStart,
    pickupEnd,
    cutoffTime,
    quantityAvailable
  } = req.body;

  const dateObj = new Date(menuDate);
  dateObj.setHours(0, 0, 0, 0);

  // Validate cutoff time is before or within reasonable range
  const cutoff = new Date(cutoffTime);
  if (isNaN(cutoff.getTime())) {
    return next(new AppError('Invalid cutoffTime provided', 400));
  }

  // Verify all meals belong to this chef and match the mealType
  const mealDocs = await Meal.find({
    _id: { $in: meals },
    chef: req.user._id,
    isRemoved: false
  });

  if (mealDocs.length !== meals.length) {
    return next(
      new AppError(
        'One or more meals do not exist or do not belong to your kitchen',
        400
      )
    );
  }

  const existingMenu = await DailyMenu.findOne({
    chef: req.user._id,
    menuDate: dateObj,
    mealType
  });

  if (existingMenu) {
    return next(
      new AppError(
        `A daily menu for ${mealType} on ${menuDate} already exists. Please update it instead.`,
        409
      )
    );
  }

  const dailyMenu = await DailyMenu.create({
    chef: req.user._id,
    menuDate: dateObj,
    mealType,
    meals,
    pickupStart,
    pickupEnd,
    cutoffTime: cutoff,
    quantityAvailable: Number(quantityAvailable)
  });

  const populatedMenu = await DailyMenu.findById(dailyMenu._id).populate('meals');

  return sendResponse(res, 201, 'Daily menu published successfully', {
    dailyMenu: populatedMenu
  });
});

/**
 * Get daily menus
 */
const getDailyMenus = asyncHandler(async (req, res, next) => {
  const { chef, date, mealType, page = 1, limit = 10 } = req.query;

  const query = {};
  if (chef) query.chef = chef;
  if (mealType) query.mealType = mealType;
  if (date) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);
    query.menuDate = { $gte: targetDate, $lt: nextDay };
  }

  const pageNum = parseInt(page, 10) || 1;
  const pageLimit = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * pageLimit;

  const [dailyMenus, total] = await Promise.all([
    DailyMenu.find(query)
      .populate('chef', 'name chefProfile.kitchenName')
      .populate('meals')
      .sort({ menuDate: 1, mealType: 1 })
      .skip(skip)
      .limit(pageLimit),
    DailyMenu.countDocuments(query)
  ]);

  return sendResponse(res, 200, 'Daily menus fetched successfully', {
    dailyMenus,
    pagination: {
      page: pageNum,
      limit: pageLimit,
      total,
      pages: Math.ceil(total / pageLimit) || 1
    }
  });
});

/**
 * Get daily menu by ID
 */
const getDailyMenuById = asyncHandler(async (req, res, next) => {
  const dailyMenu = await DailyMenu.findById(req.params.id)
    .populate('chef', 'name chefProfile.kitchenName')
    .populate('meals');

  if (!dailyMenu) {
    return next(new AppError('Daily menu not found', 404));
  }

  return sendResponse(res, 200, 'Daily menu fetched successfully', { dailyMenu });
});

/**
 * Update daily menu
 */
const updateDailyMenu = asyncHandler(async (req, res, next) => {
  const dailyMenu = await DailyMenu.findById(req.params.id);

  if (!dailyMenu) {
    return next(new AppError('Daily menu not found', 404));
  }

  if (dailyMenu.chef.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this daily menu', 403));
  }

  const updatedMenu = await DailyMenu.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('meals');

  return sendResponse(res, 200, 'Daily menu updated successfully', {
    dailyMenu: updatedMenu
  });
});

/**
 * Delete daily menu
 */
const deleteDailyMenu = asyncHandler(async (req, res, next) => {
  const dailyMenu = await DailyMenu.findById(req.params.id);

  if (!dailyMenu) {
    return next(new AppError('Daily menu not found', 404));
  }

  if (dailyMenu.chef.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this daily menu', 403));
  }

  await DailyMenu.findByIdAndDelete(req.params.id);

  return sendResponse(res, 200, 'Daily menu deleted successfully');
});

module.exports = {
  createMeal,
  getMeals,
  getMealById,
  updateMeal,
  togglePauseMeal,
  deleteMeal,
  createDailyMenu,
  getDailyMenus,
  getDailyMenuById,
  updateDailyMenu,
  deleteDailyMenu
};
