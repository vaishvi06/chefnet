/**
 * In-memory Access Token Storage
 * Access tokens are NEVER stored in localStorage or sessionStorage.
 * Refresh tokens are stored in httpOnly secure cookies handled by the backend.
 */

let inMemoryToken = null;
let onAuthFailureCallback = null;

export const getAccessToken = () => inMemoryToken;

export const setAccessToken = (token) => {
  inMemoryToken = token;
};

export const clearAccessToken = () => {
  inMemoryToken = null;
};

export const setOnAuthFailure = (callback) => {
  onAuthFailureCallback = callback;
};

export const triggerAuthFailure = () => {
  inMemoryToken = null;
  if (typeof onAuthFailureCallback === 'function') {
    onAuthFailureCallback();
  }
};

export const tokenStorage = {
  getToken: getAccessToken,
  setToken: setAccessToken,
  clearToken: clearAccessToken,
  hasToken: () => !!inMemoryToken
};
