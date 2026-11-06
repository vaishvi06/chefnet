import { apiClient } from './client';

export const geoApi = {
  searchPlaces: (q) => apiClient.get('/geo/search', { params: { q } }),
  reverseGeocode: (lat, lng) => apiClient.get('/geo/reverse', { params: { lat, lng } })
};
