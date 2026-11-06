import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Compass,
  Layers,
  QrCode,
  Heart,
  History,
  LifeBuoy,
  User,
  LayoutDashboard,
  UtensilsCrossed,
  Calendar,
  ToggleLeft,
  ScanLine,
  Users,
  MessageSquare,
  Star,
  ShieldCheck,
  Map,
  AlertOctagon,
  Users2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';

export const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const customerNav = [
    { to: '/customer/discover', label: 'Discover Kitchens', icon: Compass },
    { to: '/customer/subscriptions', label: 'My Subscriptions', icon: Layers },
    { to: '/customer/reservations', label: 'Reservations & Pass', icon: QrCode },
    { to: '/customer/favorites', label: 'Favourite Chefs', icon: Heart },
    { to: '/customer/history', label: 'Order History', icon: History },
    { to: '/customer/profile', label: 'My Profile & GPS', icon: User },
    { to: '/customer/support', label: 'Support & Tickets', icon: LifeBuoy }
  ];

  const chefNav = [
    { to: '/chef/dashboard', label: 'Kitchen Overview', icon: LayoutDashboard },
    { to: '/chef/kitchen-queue', label: "Today's Kitchen Queue", icon: UtensilsCrossed },
    { to: '/chef/scanner', label: 'Scan Customer QR', icon: ScanLine },
    { to: '/chef/subscription-requests', label: 'Subscription Requests', icon: Layers },
    { to: '/chef/meals', label: 'Meal Catalog', icon: UtensilsCrossed },
    { to: '/chef/daily-menu', label: 'Daily Menu Schedule', icon: Calendar },
    { to: '/chef/availability', label: 'Kitchen Availability', icon: ToggleLeft },
    { to: '/chef/subscribers', label: 'Subscribers & Chat', icon: Users },
    { to: '/chef/reviews', label: 'Reviews Received', icon: Star },
    { to: '/chef/profile', label: 'Kitchen Settings', icon: User },
    { to: '/chef/support', label: 'Chef Helpdesk', icon: LifeBuoy }
  ];

  const adminNav = [
    { to: '/admin/overview', label: 'Platform Analytics', icon: LayoutDashboard },
    { to: '/admin/verification', label: 'Household Verifications', icon: ShieldCheck },
    { to: '/admin/areas', label: 'Area & Geofence Zones', icon: Map },
    { to: '/admin/complaints', label: 'Complaints & Moderation', icon: AlertOctagon },
    { to: '/admin/support', label: 'Support Tickets', icon: LifeBuoy },
    { to: '/admin/users', label: 'User Directory', icon: Users2 }
  ];

  const navItems =
    user.role === 'admin' ? adminNav : user.role === 'chef' ? chefNav : customerNav;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-cream-200 min-h-[calc(100vh-4rem)] p-4 shrink-0">
      {/* User Mini Profile Card */}
      <div className="p-3.5 bg-cream-50 rounded-2xl border border-cream-200 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 border border-primary-200 text-primary-800 flex items-center justify-center font-bold text-sm uppercase overflow-hidden">
          {user.photoUrl ? (
            <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user.name?.charAt(0) || 'U'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-neutral-900 truncate">{user.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge
              variant={user.role === 'admin' ? 'danger' : user.role === 'chef' ? 'saffron' : 'primary'}
              size="sm"
            >
              {user.role === 'chef' ? 'Home Chef' : user.role}
            </Badge>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150
                ${isActive
                  ? 'bg-primary-50 text-primary-900 font-bold border-l-4 border-primary-600 shadow-2xs'
                  : 'text-neutral-600 hover:bg-cream-100 hover:text-neutral-900'
                }
              `}
            >
              <Icon className="w-4 h-4 shrink-0 text-primary-700" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
