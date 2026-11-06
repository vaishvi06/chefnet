import { apiClient } from './client';

export const supportApi = {
  createTicket: (data) => apiClient.post('/support-tickets', data),
  getMyTickets: (params = {}) => apiClient.get('/support-tickets/mine', { params })
};

