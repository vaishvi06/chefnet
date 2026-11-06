import { apiClient } from './client';

export const discoveryApi = {
  discoverChefs: (params = {}) => apiClient.get('/discovery/chefs', { params }),
  getChefById: (id) => apiClient.get(`/discovery/chefs/${id}`)
};

