import { apiClient } from './client';

export const chefApi = {
  registerKitchen: (data) => apiClient.post('/chefs/register-kitchen', data),
  updateAvailability: (availabilityStatus) =>
    apiClient.patch('/chefs/availability', { availabilityStatus }),
  addVacation: (data) => apiClient.post('/chefs/vacation', data),
  getDashboardAnalytics: () => apiClient.get('/chefs/dashboard/analytics'),
  getChefReservations: (params = {}) => apiClient.get('/chefs/reservations', { params }),
  getChefReviews: (chefId, params = {}) => apiClient.get(`/chefs/${chefId}/reviews`, { params }),

  // Kitchen queue, Kitchen code rotation, Subscriber management
  getKitchenQueue: (params = {}) => apiClient.get('/chefs/queue', { params }),
  updateKitchenCode: (data = {}) => apiClient.patch('/chefs/me/kitchen-code', data),
  getSubscribers: () => apiClient.get('/chefs/subscribers'),
  removeSubscriber: (subscriptionId, reason) =>
    apiClient.patch(`/chefs/subscribers/${subscriptionId}/remove`, { reason })
};
