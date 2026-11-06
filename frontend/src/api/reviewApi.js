import { apiClient } from './client';

export const reviewApi = {
  createReview: (data) => apiClient.post('/reviews', data)
};

