import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  CalendarCheck,
  QrCode,
  Layers,
  LayoutDashboard,
  UtensilsCrossed,
  User,
  ScanLine
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const MobileBottomNav = () => {
  const { user } = useAuth();
  if (!user) return null;

  const customerLinks = [
    { to: '/customer/discover', label: 'Discover', icon: Compass },
    { to: '/customer/subscriptions', label: 'Plans', icon: Layers },
    { to: '/customer/reservations', label: 'Pickups', icon: QrCode },
    { to: '/customer/history', label: 'History', icon: CalendarCheck },
    { to: '/customer/profile', label: 'Profile', icon: User }
  ];

  const chefLinks = [
    { to: '/chef/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/chef/kitchen-queue', label: 'Queue', icon: UtensilsCrossed },
    { to: '/chef/scanner', label: 'Scan QR', icon: ScanLine, highlight: true },
    { to: '/chef/subscription-requests', label: 'Requests', icon: Layers },
    { to: '/chef/profile', label: 'Kitchen', icon: User }
  ];

  const links = user.role === 'chef' ? chefLinks : user.role === 'customer' ? customerLinks : [];

  if (links.length === 0) return null;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-cream-200 shadow-lg px-2 py-1.5 flex items-center justify-around pb-safe"
    >
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `
              flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150
              ${link.highlight
                ? 'bg-primary-600 text-white shadow-md -translate-y-2.5 py-2 px-3 rounded-2xl'
                : isActive
                ? 'text-primary-700 font-bold'
                : 'text-neutral-500 hover:text-neutral-800'
              }
            `}
          >
            <Icon className={link.highlight ? 'w-5 h-5' : 'w-5 h-5'} />
            <span className={`text-[10px] mt-0.5 ${link.highlight ? 'text-white font-bold' : ''}`}>
              {link.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
};
