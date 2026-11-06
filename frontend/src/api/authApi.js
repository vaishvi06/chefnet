import { apiClient } from './client';

export const authApi = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (credentials) => {
    console.log('[authApi.login] Dispatching POST /auth/login with credentials:', {
      email: credentials?.email,
      password: credentials?.password ? '[PROTECTED]' : undefined
    });
    return apiClient.post('/auth/login', credentials);
  },
  refresh: () => apiClient.post('/auth/refresh'),
  logout: () => apiClient.post('/auth/logout'),
  verifyEmail: (token) => apiClient.get(`/auth/verify-email/${token}`),
  resendVerification: (email) => apiClient.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => apiClient.post(`/auth/reset-password/${token}`, { password }),
  getMe: () => apiClient.get('/auth/me'),
  changePassword: (data) => apiClient.patch('/auth/change-password', data)
};
