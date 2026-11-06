import { format, parseISO, isValid } from 'date-fns';

/**
 * Format currency in Indian Rupees (INR)
 * e.g. 150 -> ₹150
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format distance in meters or kilometers
 * e.g. 340 -> "340 m", 1200 -> "1.2 km"
 */
export const formatDistance = (meters) => {
  if (meters === null || meters === undefined || isNaN(meters)) return 'Nearby';
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

/**
 * Format Date in Indian Standard Time (Asia/Kolkata)
 */
export const formatDate = (dateInput, formatStr = 'dd MMM yyyy') => {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? parseISO(dateInput) : new Date(dateInput);
    if (!isValid(d)) return '-';
    return format(d, formatStr);
  } catch {
    return '-';
  }
};

/**
 * Format Date & Time in IST
 */
export const formatDateTime = (dateInput) => {
  return formatDate(dateInput, 'dd MMM yyyy, hh:mm a');
};

/**
 * Format Time string (e.g., "12:30" or ISO Date)
 */
export const formatTime = (timeInput) => {
  if (!timeInput) return '-';
  if (typeof timeInput === 'string' && timeInput.includes(':') && timeInput.length <= 5) {
    // HH:MM format
    const [h, m] = timeInput.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
  }
  return formatDate(timeInput, 'hh:mm a');
};

/**
 * Capitalize string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Trust Score color helper
 */
export const getTrustScoreBadge = (score = 100) => {
  if (score >= 90) return { label: 'Excellent', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (score >= 75) return { label: 'Good', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  if (score >= 50) return { label: 'Average', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  return { label: 'Needs Improvement', color: 'text-rose-700 bg-rose-50 border-rose-200' };
};

