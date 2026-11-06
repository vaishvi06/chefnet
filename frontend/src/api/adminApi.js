import { apiClient } from './client';

export const adminApi = {
  getAdminAnalytics: () => apiClient.get('/admin/analytics'),
  getPendingChefs: (params = {}) => apiClient.get('/admin/chefs/pending', { params }),
  approveChef: (id) => apiClient.patch(`/admin/chefs/${id}/approve`),
  rejectChef: (id, reason) => apiClient.patch(`/admin/chefs/${id}/reject`, { reason }),
  toggleSuspendChef: (id, data = {}) => apiClient.patch(`/admin/chefs/${id}/suspend`, data),
  getAreas: () => apiClient.get('/admin/areas'),
  createArea: (data) => apiClient.post('/admin/areas', data),
  updateArea: (id, data) => apiClient.patch(`/admin/areas/${id}`, data),
  activateArea: (id) => apiClient.patch(`/admin/areas/${id}/activate`),
  getWaitingLists: (params = {}) => apiClient.get('/admin/waiting-lists', { params }),
  getComplaints: (params = {}) => apiClient.get('/admin/complaints', { params }),
  resolveComplaint: (id, data) => apiClient.patch(`/admin/complaints/${id}/resolve`, data),
  getSupportTickets: (params = {}) => apiClient.get('/admin/support-tickets', { params }),
  updateSupportTicket: (id, data) => apiClient.patch(`/admin/support-tickets/${id}`, data),
  getUsers: (params = {}) => apiClient.get('/admin/users', { params }),
  toggleSuspendUser: (id, data = {}) => apiClient.patch(`/admin/users/${id}/suspend`, data)
};

