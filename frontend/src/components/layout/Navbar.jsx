import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  UtensilsCrossed,
  User as UserIcon,
  LogOut,
  MapPin,
  Shield,
  ChefHat
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';

export const Navbar = ({ unreadCount = 0 }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin/overview';
    if (user.role === 'chef') return '/chef/dashboard';
    return '/customer/discover';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-cream-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to={getRoleDashboardLink()} className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <UtensilsCrossed className="w-5 h-5 text-saffron-300" />
          </div>
          <div>
            <span className="font-serif text-xl font-bold tracking-tight text-primary-900 group-hover:text-primary-700 transition-colors">
              Chief<span className="text-saffron-600">Net</span>
            </span>
            <span className="hidden sm:block text-[10px] text-neutral-400 font-medium tracking-wide">
              1 KM HYPERLOCAL FOOD
            </span>
          </div>
        </Link>

        {/* Right side controls */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            {/* Area Indicator badge */}
            {user.area && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-cream-100 rounded-full text-xs text-neutral-600 border border-cream-200">
                <MapPin className="w-3.5 h-3.5 text-primary-600" />
                <span className="font-medium truncate max-w-[160px]">
                  {typeof user.area === 'object' ? user.area.name : 'Hyperlocal Zone'}
                </span>
              </div>
            )}

            {/* Notifications Button */}
            <Link
              to={user.role === 'admin' ? '/admin/support' : user.role === 'chef' ? '/chef/notifications' : '/customer/notifications'}
              className="relative p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-cream-100 transition-colors"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-terracotta-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* User Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1 pl-2 rounded-2xl hover:bg-cream-100 transition-colors border border-transparent hover:border-cream-200"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 border border-primary-200 text-primary-800 flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name?.charAt(0) || 'U'
                  )}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <p className="font-semibold text-neutral-800 truncate max-w-[120px]">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-neutral-500 capitalize">
                    {user.role === 'chef' ? 'Home Chef' : user.role}
                  </p>
                </div>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-cream-200 shadow-xl z-40 p-2 text-xs divide-y divide-cream-100 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2">
                      <p className="font-semibold text-neutral-800 truncate">{user.name}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <Badge
                          variant={user.role === 'admin' ? 'danger' : user.role === 'chef' ? 'saffron' : 'primary'}
                          size="sm"
                        >
                          {user.role === 'chef' ? 'Verified Chef' : user.role.toUpperCase()}
                        </Badge>
                        <span className="text-[11px] text-neutral-500">
                          Trust: {user.trustScore ?? 100}%
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to={user.role === 'chef' ? '/chef/profile' : user.role === 'admin' ? '/admin/overview' : '/customer/profile'}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-neutral-700 hover:bg-cream-100 transition-colors"
                      >
                        <UserIcon className="w-4 h-4 text-neutral-400" />
                        <span>Profile & Settings</span>
                      </Link>

                      {user.role === 'customer' && (
                        <Link
                          to="/customer/support"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-neutral-700 hover:bg-cream-100 transition-colors"
                        >
                          <Shield className="w-4 h-4 text-neutral-400" />
                          <span>Help & Support</span>
                        </Link>
                      )}

                      {user.role === 'chef' && (
                        <Link
                          to="/chef/support"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-neutral-700 hover:bg-cream-100 transition-colors"
                        >
                          <ChefHat className="w-4 h-4 text-neutral-400" />
                          <span>Chef Helpdesk</span>
                        </Link>
                      )}
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-terracotta-700 hover:bg-terracotta-50 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 text-terracotta-500" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-neutral-700 hover:text-primary-700 px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-xs sm:text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

