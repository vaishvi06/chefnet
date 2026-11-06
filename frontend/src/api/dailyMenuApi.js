import { apiClient } from './client';

export const dailyMenuApi = {
  getDailyMenus: (params = {}) => apiClient.get('/daily-menus', { params }),
  getDailyMenuById: (id) => apiClient.get(`/daily-menus/${id}`),
  createDailyMenu: (data) => apiClient.post('/daily-menus', data),
  updateDailyMenu: (id, data) => apiClient.patch(`/daily-menus/${id}`, data),
  deleteDailyMenu: (id) => apiClient.delete(`/daily-menus/${id}`)
};

