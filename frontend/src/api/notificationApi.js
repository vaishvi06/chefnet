import { apiClient } from './client';

export const notificationApi = {
  getNotifications: (params = {}) => apiClient.get('/notifications', { params }),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch('/notifications/read-all')
};

