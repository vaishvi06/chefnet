export const APP_NAME = 'ChiefNet';
export const TAGLINE = 'Hyperlocal Homemade Meals from Kitchens within 1 km';

export const ROLES = {
  CUSTOMER: 'customer',
  CHEF: 'chef',
  ADMIN: 'admin'
};

export const MEAL_CATEGORIES = [
  { value: 'gujarati', label: 'Gujarati', icon: '🍲' },
  { value: 'punjabi', label: 'Punjabi', icon: '🍛' },
  { value: 'south_indian', label: 'South Indian', icon: '🥘' },
  { value: 'jain', label: 'Pure Jain', icon: '🌿' },
  { value: 'healthy_diet', label: 'Healthy & Diet', icon: '🥗' },
  { value: 'student_budget', label: 'Student Budget', icon: '🍱' }
];

export const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' }
];

export const PLAN_TYPES = [
  { value: 'weekly', label: 'Weekly Plan (7 Days)', days: 7 },
  { value: 'monthly', label: 'Monthly Plan (30 Days)', days: 30 }
];

export const MEAL_PLANS = [
  { value: 'breakfast', label: 'Breakfast Only' },
  { value: 'lunch', label: 'Lunch Only' },
  { value: 'dinner', label: 'Dinner Only' },
  { value: 'full_day', label: 'Full Day (All 3 Meals)' }
];

export const DIETARY_PREFERENCES = [
  { value: 'all', label: 'All Cuisines' },
  { value: 'veg', label: 'Pure Vegetarian' },
  { value: 'jain', label: 'Jain (No Onion / Garlic)' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'non_veg', label: 'Non-Vegetarian' }
];

export const AVAILABILITY_STATUSES = {
  accepting: { label: 'Accepting Subscriptions', color: 'emerald', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  limited: { label: 'Limited Slots Left', color: 'amber', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  full: { label: 'Fully Booked', color: 'rose', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  paused: { label: 'Temporarily Paused', color: 'neutral', bg: 'bg-neutral-100 text-neutral-600 border-neutral-200' }
};

export const RESERVATION_STATUSES = {
  reserved: { step: 1, label: 'Reserved', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  preparing: { step: 2, label: 'Preparing', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  ready: { step: 3, label: 'Ready for Pickup', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  picked_up: { step: 4, label: 'Picked Up', badge: 'bg-green-100 text-green-800 border-green-300' },
  missed: { step: 0, label: 'Missed', badge: 'bg-red-50 text-red-700 border-red-200' },
  cancelled: { step: 0, label: 'Cancelled', badge: 'bg-neutral-100 text-neutral-600 border-neutral-200' }
};

export const SUBSCRIPTION_STATUSES = {
  pending: { label: 'Pending Approval', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  active: { label: 'Active', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  accepted: { label: 'Accepted', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  paused: { label: 'Paused', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  rejected: { label: 'Rejected', badge: 'bg-red-50 text-red-700 border-red-200' },
  cancelled: { label: 'Cancelled', badge: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
  expired: { label: 'Expired', badge: 'bg-neutral-100 text-neutral-500 border-neutral-200' }
};

export const COMPLAINT_CATEGORIES = [
  { value: 'food_quality', label: 'Food Quality Issue' },
  { value: 'incorrect_info', label: 'Incorrect Menu Information' },
  { value: 'hygiene', label: 'Hygiene / Cleanliness Concern' },
  { value: 'misconduct', label: 'Behavioral Misconduct' }
];

export const DEFAULT_COORDINATES = [77.6741, 12.9279]; // Bellandur Bangalore [lng, lat]

