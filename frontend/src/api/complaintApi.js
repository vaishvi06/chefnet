import { apiClient } from './client';

export const complaintApi = {
  createComplaint: (data) => apiClient.post('/complaints', data),
  getMyComplaints: (params = {}) => apiClient.get('/complaints/mine', { params })
};

