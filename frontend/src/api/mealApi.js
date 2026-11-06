import { apiClient } from './client';

export const mealApi = {
  getMeals: (params = {}) => apiClient.get('/meals', { params }),
  getMealById: (id) => apiClient.get(`/meals/${id}`),
  createMeal: (data) => {
    if (data instanceof FormData) {
      return apiClient.post('/meals', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return apiClient.post('/meals', data);
  },
  updateMeal: (id, data) => {
    if (data instanceof FormData) {
      return apiClient.patch(`/meals/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return apiClient.patch(`/meals/${id}`, data);
  },
  togglePauseMeal: (id, isPaused) => apiClient.patch(`/meals/${id}/pause`, { isPaused }),
  deleteMeal: (id) => apiClient.delete(`/meals/${id}`)
};

