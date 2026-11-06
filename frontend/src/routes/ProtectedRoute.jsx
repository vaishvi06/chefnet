import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Skeleton } from '../components/ui/Skeleton';

export const ProtectedRoute = ({ children, allowedRoles = [], checkLocation = false }) => {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth();
  const location = useLocation();

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream-50">
        <div className="w-12 h-12 rounded-2xl bg-primary-600 animate-bounce flex items-center justify-center text-white mb-4 shadow-md">
          🍲
        </div>
        <p className="text-sm font-serif font-bold text-neutral-700">Loading ChiefNet...</p>
        <div className="w-48 mt-4">
          <Skeleton variant="text" count={2} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  // Location onboarding redirect for customers who haven't verified location
  if (
    checkLocation &&
    user.role === 'customer' &&
    !user.isLocationVerified &&
    location.pathname !== '/onboarding'
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

