import React from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { Footer } from './Footer';
import { VerificationAlerts } from '../shared/VerificationAlerts';
import { SuspendedNotice } from '../shared/SuspendedNotice';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../api/notificationApi';

export const CustomerLayout = () => {
  const { user } = useAuth();

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationApi.getNotifications({ limit: 1 }),
    enabled: !!user && !user.isSuspended,
    refetchInterval: 30000
  });

  if (user?.isSuspended) {
    return <SuspendedNotice />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-neutral-800">
      <Navbar unreadCount={notifData?.data?.unreadCount || 0} />
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-5xl overflow-hidden">
          <VerificationAlerts />
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <MobileBottomNav />
      <Footer />
    </div>
  );
};
