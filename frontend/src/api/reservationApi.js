import { apiClient } from './client';

export const reservationApi = {
  createReservation: (data) => apiClient.post('/reservations', data),
  getReservations: (params = {}) => apiClient.get('/reservations', { params }),
  updateReservationStatus: (id, status) => apiClient.patch(`/reservations/${id}/status`, { status }),
  getReservationQR: (id) => apiClient.get(`/reservations/${id}/qr`),
  verifyQR: (qrToken) => apiClient.post('/reservations/verify', { token: qrToken }),
  verifyReservation: (token) => apiClient.post('/reservations/verify', { token })
};
