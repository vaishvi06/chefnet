/**
 * Calculate Trust Score (0 - 100)
 *
 * Formula:
 * Trust Score = Fulfillment (40%) + Timeliness (25%) + Rating (25%) + Reliability/Low Cancellations (10%)
 *
 * - Fulfillment Score (0 - 40 pts):
 *   completionRate = pickedUpCount / max(1, totalCount)
 *   fulfillment = completionRate * 40
 *
 * - Timeliness Score (0 - 25 pts):
 *   timelinessRate = max(0, (pickedUpCount - missedPickupCount) / max(1, pickedUpCount + missedPickupCount))
 *   timeliness = timelinessRate * 25
 *
 * - Rating Score (0 - 25 pts):
 *   If ratingCount == 0 -> default 20 pts
 *   Else -> (ratingAverage / 5.0) * 25
 *
 * - Cancellation Frequency Score (0 - 10 pts):
 *   cancellationRate = cancelledCount / max(1, totalCount)
 *   cancellationScore = max(0, 1 - cancellationRate) * 10
 */
const calculateTrustScore = ({
  totalReservations = 0,
  pickedUpCount = 0,
  missedPickupCount = 0,
  cancelledCount = 0,
  ratingAverage = 5,
  ratingCount = 0
}) => {
  // If brand new user with no history, start with baseline 100
  if (totalReservations === 0 && ratingCount === 0 && missedPickupCount === 0) {
    return 100;
  }

  const effectiveTotal = Math.max(1, totalReservations);

  // 1. Fulfillment (40%)
  const completionRate = Math.min(1, pickedUpCount / effectiveTotal);
  const fulfillmentScore = completionRate * 40;

  // 2. Timeliness (25%)
  const totalPickupAttempts = Math.max(1, pickedUpCount + missedPickupCount);
  const timelinessRate = Math.max(0, (pickedUpCount - missedPickupCount) / totalPickupAttempts);
  const timelinessScore = timelinessRate * 25;

  // 3. Rating (25%)
  const ratingScore = ratingCount === 0 ? 20 : (Math.min(5, Math.max(1, ratingAverage)) / 5) * 25;

  // 4. Low Cancellation Frequency (10%)
  const cancellationRate = Math.min(1, cancelledCount / effectiveTotal);
  const cancellationScore = Math.max(0, 1 - cancellationRate) * 10;

  const totalScore = Math.round(
    fulfillmentScore + timelinessScore + ratingScore + cancellationScore
  );

  return Math.min(100, Math.max(0, totalScore));
};

module.exports = {
  calculateTrustScore
};
