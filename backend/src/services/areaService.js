const Area = require('../models/areaModel');
const User = require('../models/userModel');
const WaitingListEntry = require('../models/waitingListModel');

/**
 * Find the matching area for a given coordinate [longitude, latitude]
 */
const findAreaForCoordinates = async (lng, lat) => {
  // 1. Try finding by polygon geoIntersects
  let area = await Area.findOne({
    geoFence: {
      $geoIntersects: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        }
      }
    }
  });

  // 2. If no polygon match, find nearest area by center within its radius
  if (!area) {
    const areas = await Area.find({
      center: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: 10000 // up to 10km search
        }
      }
    });

    for (const a of areas) {
      // Calculate distance in meters using haversine formula
      const dist = calculateHaversineDistance(
        lat,
        lng,
        a.center.coordinates[1],
        a.center.coordinates[0]
      );
      if (dist <= a.radiusInMeters) {
        area = a;
        break;
      }
    }
  }

  return area;
};

/**
 * Calculate distance in meters between two lat/lng pairs
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check and update area activation based on approved chefs count
 */
const checkAndUpdateAreaActivation = async (areaId) => {
  const area = await Area.findById(areaId);
  if (!area) return null;

  // Count approved, location-verified chefs in this area
  const approvedChefsCount = await User.countDocuments({
    role: 'chef',
    area: area._id,
    isLocationVerified: true,
    'chefProfile.verificationStatus': 'approved',
    isSuspended: false
  });

  if (approvedChefsCount >= area.activationThreshold && !area.isActive) {
    area.isActive = true;
    await area.save();
    console.log(`[Area Activation] Area "${area.name}" automatically activated with ${approvedChefsCount} approved chefs!`);
  }

  return area;
};

/**
 * Process location verification for user
 */
const processUserLocation = async (user, lng, lat) => {
  // Update user's coordinate and set isLocationVerified = true
  user.location = {
    type: 'Point',
    coordinates: [lng, lat]
  };
  user.isLocationVerified = true;

  // Match or associate area
  const matchedArea = await findAreaForCoordinates(lng, lat);
  if (matchedArea) {
    user.area = matchedArea._id;
  }
  await user.save({ validateBeforeSave: false });

  if (!matchedArea) {
    return {
      success: true,
      isLocationVerified: true,
      area: null,
      areaActive: false,
      message: 'Location verified, but your location is outside all currently mapped ChiefNet zones.'
    };
  }

  // If user is a chef, re-evaluate area activation
  if (user.role === 'chef') {
    const updatedArea = await checkAndUpdateAreaActivation(matchedArea._id);
    return {
      success: true,
      isLocationVerified: true,
      area: updatedArea,
      areaActive: updatedArea.isActive,
      message: 'Chef location verified successfully.'
    };
  }

  // If user is a customer, check area status
  const currentArea = await checkAndUpdateAreaActivation(matchedArea._id);
  if (!currentArea.isActive) {
    // Add to waiting list entry if not already present
    const existingEntry = await WaitingListEntry.findOne({
      customer: user._id,
      area: currentArea._id
    });

    if (!existingEntry) {
      await WaitingListEntry.create({
        customer: user._id,
        area: currentArea._id
      });
      currentArea.demandCount += 1;
      await currentArea.save();
    }

    return {
      success: false,
      isLocationVerified: true,
      areaActive: false,
      waitingList: true,
      area: currentArea,
      message: `Area "${currentArea.name}" is not active yet (requires ${currentArea.activationThreshold} approved chefs). You have been added to the waiting list.`
    };
  }

  return {
    success: true,
    isLocationVerified: true,
    areaActive: true,
    waitingList: false,
    area: currentArea,
    message: `Location verified. Area "${currentArea.name}" is active! You can discover home chefs within 1 km.`
  };
};

module.exports = {
  findAreaForCoordinates,
  calculateHaversineDistance,
  checkAndUpdateAreaActivation,
  processUserLocation
};
