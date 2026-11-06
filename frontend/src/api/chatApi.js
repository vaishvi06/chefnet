import { apiClient } from './client';

export const chatApi = {
  getSubscriptionMessages: (subscriptionId, params = {}) =>
    apiClient.get(`/chat/${subscriptionId}/messages`, { params }),
  sendMessage: (subscriptionId, text) =>
    apiClient.post(`/chat/${subscriptionId}/messages`, { text })
};

