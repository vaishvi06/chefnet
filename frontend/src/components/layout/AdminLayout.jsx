import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { SuspendedNotice } from '../shared/SuspendedNotice';
import { useAuth } from '../../context/AuthContext';

export const AdminLayout = () => {
  const { user } = useAuth();

  if (user?.isSuspended) {
    return <SuspendedNotice />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-neutral-800">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl overflow-hidden">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
};

