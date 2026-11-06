import { apiClient } from './client';

export const userApi = {
  updateMe: (data) => {
    if (data instanceof FormData) {
      return apiClient.patch('/users/me', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return apiClient.patch('/users/me', data);
  },
  updateLocation: (payload) => apiClient.post('/users/me/location', payload),
  getPublicProfile: (id) => apiClient.get(`/users/${id}/public`)
};

