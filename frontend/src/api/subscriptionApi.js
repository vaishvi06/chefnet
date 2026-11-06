import { apiClient } from './client';

export const subscriptionApi = {
  createSubscription: (data) => apiClient.post('/subscriptions', data),
  getSubscriptions: (params = {}) => apiClient.get('/subscriptions', { params }),
  acceptSubscription: (id) => apiClient.patch(`/subscriptions/${id}/accept`),
  rejectSubscription: (id) => apiClient.patch(`/subscriptions/${id}/reject`),
  pauseSubscription: (id, data) => apiClient.patch(`/subscriptions/${id}/pause`, data),
  resumeSubscription: (id) => apiClient.patch(`/subscriptions/${id}/resume`),
  cancelSubscription: (id, data) => apiClient.patch(`/subscriptions/${id}/cancel`, data)
};

