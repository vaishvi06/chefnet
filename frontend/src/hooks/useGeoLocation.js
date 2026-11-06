import { useState, useCallback } from 'react';
import { DEFAULT_COORDINATES } from '../utils/constants';

/**
 * Hook for requesting and accessing browser GPS location
 */
export const useGeoLocation = () => {
  const [coordinates, setCoordinates] = useState(null); // [lng, lat]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const errMsg = 'Geolocation is not supported by your browser.';
        setError(errMsg);
        resolve({ success: false, error: errMsg, coordinates: DEFAULT_COORDINATES });
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const coords = [lng, lat];
          setCoordinates(coords);
          setLoading(false);
          resolve({ success: true, coordinates: coords, lat, lng });
        },
        (err) => {
          setLoading(false);
          let message = 'Unable to retrieve your location.';
          if (err.code === 1) {
            message = 'Location permission was denied. Please adjust your map pin manually.';
          } else if (err.code === 2) {
            message = 'Position unavailable. Please adjust your map pin manually.';
          } else if (err.code === 3) {
            message = 'Location request timed out. Please adjust your map pin manually.';
          }
          setError(message);
          resolve({ success: false, error: message, coordinates: DEFAULT_COORDINATES });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  return {
    coordinates,
    setCoordinates,
    loading,
    error,
    requestLocation
  };
};

