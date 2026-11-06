const geoService = require('../services/geoService');
const asyncHandler = require('../utils/asyncHandler');
const { sendResponse } = require('../utils/response');
const AppError = require('../utils/appError');

/**
 * Search places by query string
 */
const searchPlaces = asyncHandler(async (req, res, next) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return sendResponse(res, 200, 'Search query too short', { results: [] });
  }

  const results = await geoService.search(q.trim());
  return sendResponse(res, 200, 'Places fetched successfully', { results });
});

/**
 * Reverse geocode lat/lng to human-readable address
 */
const reverseGeocode = asyncHandler(async (req, res, next) => {
  const lat = req.query.lat || req.query.latitude;
  const lng = req.query.lng || req.query.longitude || req.query.lon;

  if (lat === undefined || lng === undefined) {
    return next(new AppError('Both latitude and longitude are required', 400));
  }

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    return next(new AppError('Invalid coordinates provided', 400));
  }

  const result = await geoService.reverse(parsedLat, parsedLng);
  return sendResponse(res, 200, 'Address resolved successfully', { location: result });
});

module.exports = {
  searchPlaces,
  reverseGeocode
};

