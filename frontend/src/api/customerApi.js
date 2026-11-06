import { apiClient } from './client';

export const customerApi = {
  getFavorites: () => apiClient.get('/customers/favorites'),
  addFavorite: (chefId) => apiClient.post(`/customers/favorites/${chefId}`),
  removeFavorite: (chefId) => apiClient.delete(`/customers/favorites/${chefId}`),
  getHistory: (params = {}) => apiClient.get('/customers/history', { params })
};

