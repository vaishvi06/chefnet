import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import {
  setAccessToken,
  clearAccessToken,
  getAccessToken,
  setOnAuthFailure
} from '../utils/tokenStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Restore session on app boot
  const initSession = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Attempt token refresh using httpOnly cookie
      const refreshRes = await authApi.refresh();
      const token = refreshRes.data?.accessToken;
      if (token) {
        setAccessToken(token);
        // 2. Fetch authenticated user profile
        const meRes = await authApi.getMe();
        setUser(meRes.data?.user || null);
      } else {
        setUser(null);
        clearAccessToken();
      }
    } catch {
      // Normal when guest or expired cookie
      setUser(null);
      clearAccessToken();
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    // Interceptor failure hook
    setOnAuthFailure(() => {
      setUser(null);
    });

    initSession();
  }, [initSession]);

  const login = async (credentials) => {
    setIsLoading(true);
    console.log('[AuthContext.login] Initiating login with payload:', {
      email: credentials?.email,
      password: credentials?.password ? '[PROTECTED]' : undefined
    });
    try {
      const res = await authApi.login(credentials);
      const { user: loggedInUser, accessToken } = res.data || {};
      if (accessToken) {
        setAccessToken(accessToken);
      }
      setUser(loggedInUser);
      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(userData);
      const { user: registeredUser, accessToken } = res.data || {};
      if (accessToken) {
        setAccessToken(accessToken);
      }
      setUser(registeredUser);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      clearAccessToken();
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res.data?.user) {
        setUser(res.data.user);
      }
    } catch {
      // ignore
    }
  };

  const value = {
    user,
    setUser,
    isLoading,
    isInitialized,
    isAuthenticated: !!user && !!getAccessToken(),
    login,
    register,
    logout,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

