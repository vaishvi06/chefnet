import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

// Layouts
import { PublicLayout } from '../components/layout/PublicLayout';
import { CustomerLayout } from '../components/layout/CustomerLayout';
import { ChefLayout } from '../components/layout/ChefLayout';
import { AdminLayout } from '../components/layout/AdminLayout';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage';
import { LoginPage } from '../pages/public/LoginPage';
import { RegisterPage } from '../pages/public/RegisterPage';
import { ForgotPasswordPage } from '../pages/public/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/public/ResetPasswordPage';
import { VerifyEmailPage } from '../pages/public/VerifyEmailPage';
import { Forbidden403Page } from '../pages/public/Forbidden403Page';
import { NotFound404Page } from '../pages/public/NotFound404Page';

// Customer Pages
import { CustomerOnboarding } from '../pages/customer/CustomerOnboarding';
import { DiscoverPage } from '../pages/customer/DiscoverPage';
import { ChefProfilePage } from '../pages/customer/ChefProfilePage';
import { SubscriptionsPage } from '../pages/customer/SubscriptionsPage';
import { ReservationsPage } from '../pages/customer/ReservationsPage';
import { CustomerChatPage } from '../pages/customer/CustomerChatPage';
import { CustomerFavoritesPage } from '../pages/customer/CustomerFavoritesPage';
import { CustomerHistoryPage } from '../pages/customer/CustomerHistoryPage';
import { NotificationsPage } from '../pages/customer/NotificationsPage';
import { CustomerProfilePage } from '../pages/customer/CustomerProfilePage';
import { SupportTicketsPage } from '../pages/customer/SupportTicketsPage';
import { CustomerNotFoundPage } from '../pages/customer/CustomerNotFoundPage';

// Chef Pages
import { ChefOnboarding } from '../pages/chef/ChefOnboarding';
import { ChefDashboardPage } from '../pages/chef/ChefDashboardPage';
import { ChefMealsPage } from '../pages/chef/ChefMealsPage';
import { DailyMenuPage } from '../pages/chef/DailyMenuPage';
import { ChefAvailabilityPage } from '../pages/chef/ChefAvailabilityPage';
import { SubscriptionRequestsPage } from '../pages/chef/SubscriptionRequestsPage';
import { KitchenQueuePage } from '../pages/chef/KitchenQueuePage';
import { ChefQrScannerPage } from '../pages/chef/ChefQrScannerPage';
import { ChefSubscribersPage } from '../pages/chef/ChefSubscribersPage';
import { ChefReviewsPage } from '../pages/chef/ChefReviewsPage';

// Admin Pages
import { AdminOverviewPage } from '../pages/admin/AdminOverviewPage';
import { ChefVerificationPage } from '../pages/admin/ChefVerificationPage';
import { AreaManagementPage } from '../pages/admin/AreaManagementPage';
import { ComplaintsModerationPage } from '../pages/admin/ComplaintsModerationPage';
import { AdminSupportPage } from '../pages/admin/AdminSupportPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';

export const AppRoutes = () => {
  const { user, isAuthenticated } = useAuth();

  // Root redirect helper for authenticated users
  const getHomeRedirect = () => {
    if (!isAuthenticated || !user) return <LandingPage />;
    if (user.role === 'chef') return <Navigate to="/chef/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/overview" replace />;
    return <Navigate to="/customer/discover" replace />;
  };

  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={getHomeRedirect()} />
        <Route
          path="/login"
          element={
            isAuthenticated && user ? (
              <Navigate
                to={
                  user.role === 'chef'
                    ? '/chef/dashboard'
                    : user.role === 'admin'
                    ? '/admin/overview'
                    : '/customer/discover'
                }
                replace
              />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated && user ? (
              <Navigate
                to={
                  user.role === 'chef'
                    ? '/chef/dashboard'
                    : user.role === 'admin'
                    ? '/admin/overview'
                    : '/customer/discover'
                }
                replace
              />
            ) : (
              <RegisterPage />
            )
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        <Route path="/403" element={<Forbidden403Page />} />
      </Route>

      {/* Customer Routes */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/customer/discover" replace />} />
        <Route path="onboarding" element={<CustomerOnboarding />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="chefs/:id" element={<ChefProfilePage />} />
        <Route path="subscriptions" element={<SubscriptionsPage />} />
        <Route path="reservations" element={<ReservationsPage />} />
        <Route path="chat" element={<CustomerChatPage />} />
        <Route path="chat/:subscriptionId" element={<CustomerChatPage />} />
        <Route path="favorites" element={<CustomerFavoritesPage />} />
        <Route path="history" element={<CustomerHistoryPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<CustomerProfilePage />} />
        <Route path="support" element={<SupportTicketsPage />} />
        <Route path="*" element={<CustomerNotFoundPage />} />
      </Route>

      {/* Chef Routes */}
      <Route
        path="/chef"
        element={
          <ProtectedRoute allowedRoles={['chef']}>
            <ChefLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/chef/dashboard" replace />} />
        <Route path="onboarding" element={<ChefOnboarding />} />
        <Route path="dashboard" element={<ChefDashboardPage />} />
        <Route path="meals" element={<ChefMealsPage />} />
        <Route path="daily-menu" element={<DailyMenuPage />} />
        <Route path="menus" element={<Navigate to="/chef/daily-menu" replace />} />
        <Route path="availability" element={<ChefAvailabilityPage />} />
        <Route path="subscription-requests" element={<SubscriptionRequestsPage />} />
        <Route path="requests" element={<Navigate to="/chef/subscription-requests" replace />} />
        <Route path="kitchen-queue" element={<KitchenQueuePage />} />
        <Route path="queue" element={<Navigate to="/chef/kitchen-queue" replace />} />
        <Route path="scanner" element={<ChefQrScannerPage />} />
        <Route path="subscribers" element={<ChefSubscribersPage />} />
        <Route path="reviews" element={<ChefReviewsPage />} />
        <Route path="chat" element={<CustomerChatPage />} />
        <Route path="chat/:subscriptionId" element={<CustomerChatPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<CustomerProfilePage />} />
        <Route path="support" element={<SupportTicketsPage />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/overview" replace />} />
        <Route path="overview" element={<AdminOverviewPage />} />
        <Route path="verification" element={<ChefVerificationPage />} />
        <Route path="verifications" element={<Navigate to="/admin/verification" replace />} />
        <Route path="areas" element={<AreaManagementPage />} />
        <Route path="complaints" element={<ComplaintsModerationPage />} />
        <Route path="support" element={<AdminSupportPage />} />
        <Route path="users" element={<AdminUsersPage />} />
      </Route>

      {/* Convenience redirects for root customer paths */}
      <Route path="/discover" element={<Navigate to="/customer/discover" replace />} />
      <Route path="/subscriptions" element={<Navigate to="/customer/subscriptions" replace />} />
      <Route path="/reservations" element={<Navigate to="/customer/reservations" replace />} />
      <Route path="/favorites" element={<Navigate to="/customer/favorites" replace />} />
      <Route path="/history" element={<Navigate to="/customer/history" replace />} />
      <Route path="/profile" element={<Navigate to="/customer/profile" replace />} />
      <Route path="/support" element={<Navigate to="/customer/support" replace />} />
      <Route path="/notifications" element={<Navigate to="/customer/notifications" replace />} />
      <Route path="/onboarding" element={<Navigate to="/customer/onboarding" replace />} />
      <Route
        path="/chat/:subscriptionId"
        element={
          <ProtectedRoute allowedRoles={['customer', 'chef']}>
            <CustomerChatPage />
          </ProtectedRoute>
        }
      />

      {/* 404 Catch All for Global */}
      <Route path="*" element={<NotFound404Page />} />
    </Routes>
  );
};
