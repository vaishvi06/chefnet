import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  Users,
  Layers,
  IndianRupee,
  UtensilsCrossed,
  ScanLine,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  KeyRound,
  Copy,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { chefApi } from '../../api/chefApi';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const ChefDashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const isApproved = user?.chefProfile?.verificationStatus === 'approved';

  // Kitchen Code Rotation modal state
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [newCodeInput, setNewCodeInput] = useState('');

  const rotateCodeMutation = useMutation({
    mutationFn: (code) => chefApi.updateKitchenCode({ kitchenCode: code || undefined }),
    onSuccess: (res) => {
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ['chefQueue'] });
      setCodeModalOpen(false);
      setNewCodeInput('');
      toast.success(res.message || 'Kitchen code updated and active reservations refreshed!');
    },
    onError: (err) => toast.error(err.message || 'Failed to update kitchen code')
  });

  const { data: analyticsRes, isLoading } = useQuery({
    queryKey: ['chefDashboardAnalytics'],
    queryFn: chefApi.getDashboardAnalytics,
    enabled: isApproved
  });

  const { data: queueRes } = useQuery({
    queryKey: ['chefTodayReservations'],
    queryFn: () => chefApi.getChefReservations({ date: new Date().toISOString().split('T')[0] }),
    enabled: isApproved
  });

  const analytics = analyticsRes?.data;
  const todayReservations = queueRes?.data?.reservations || [];

  const reservedCount = todayReservations.filter((r) => r.status === 'reserved').length;
  const preparingCount = todayReservations.filter((r) => r.status === 'preparing').length;
  const readyCount = todayReservations.filter((r) => r.status === 'ready').length;
  const pickedUpCount = todayReservations.filter((r) => r.status === 'picked_up').length;

  if (!isApproved) {
    return (
      <Card className="p-8 text-center border-amber-300 bg-amber-50/50 space-y-4 max-w-xl mx-auto my-8">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-neutral-900">
          Kitchen Verification in Progress
        </h2>
        <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-md mx-auto">
          Your kitchen application is currently being evaluated by the ChiefNet administration team. You can configure your operating hours and GPS pin while you wait.
        </p>
        <div>
          <Link to="/chef/onboarding">
            <Button variant="primary" size="md">
              Review Kitchen Onboarding
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome header & quick action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
              Kitchen Dashboard
            </h1>
            <Badge variant="success" size="sm">
              Live & Verified
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            {user?.chefProfile?.kitchenName || `${user?.name}'s Kitchen`} • Today's live meal preparations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/chef/kitchen-queue">
            <Button variant="outline" size="sm" icon={UtensilsCrossed} className="bg-white">
              Live Queue
            </Button>
          </Link>
          <Link to="/chef/scanner">
            <Button variant="primary" size="sm" icon={ScanLine} className="font-bold shadow-sm">
              Scan Pass QR
            </Button>
          </Link>
          <Link to="/chef/daily-menu">
            <Button variant="outline" size="sm" icon={Calendar} className="bg-white">
              Daily Menus
            </Button>
          </Link>
        </div>
      </div>

      {/* Kitchen Code Bar */}
      <Card className="p-4 bg-gradient-to-r from-primary-900 to-primary-800 text-white border-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-saffron-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-cream-200 font-semibold">
                Kitchen Pass Code:
              </span>
              <span className="font-mono text-base font-bold text-saffron-300 tracking-wider">
                {user?.chefProfile?.kitchenCode || 'CHF-XXXX'}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (user?.chefProfile?.kitchenCode) {
                    navigator.clipboard.writeText(user.chefProfile.kitchenCode);
                    toast.success('Kitchen code copied!');
                  }
                }}
                className="p-1 rounded-md hover:bg-white/10 text-white/80 transition"
                title="Copy Kitchen Code"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-cream-200 mt-0.5">
              Customers use this prefix on their pickup pass tokens for physical verification.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setNewCodeInput(user?.chefProfile?.kitchenCode || '');
            setCodeModalOpen(true);
          }}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Change Code
        </Button>
      </Card>

      {/* Today at a Glance Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton variant="card" count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Earnings */}
          <Card className="p-4 sm:p-5 border-cream-300 bg-white">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Today's Earnings</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-serif font-bold text-neutral-900">
              {formatCurrency(analytics?.earnings?.daily || 0)}
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Weekly: <strong>{formatCurrency(analytics?.earnings?.weekly || 0)}</strong>
            </p>
          </Card>

          {/* Reservations to Prepare */}
          <Card className="p-4 sm:p-5 border-cream-300 bg-white">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Meals to Cook</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-serif font-bold text-neutral-900">
              {reservedCount + preparingCount}
            </p>
            <p className="text-[11px] text-amber-700 font-semibold mt-1">
              {preparingCount} in kitchen preparation
            </p>
          </Card>

          {/* Active Subscribers & Capacity */}
          <Card className="p-4 sm:p-5 border-cream-300 bg-white">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Subscribers</span>
              <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-serif font-bold text-neutral-900">
              {analytics?.subscriptions?.activeSubscribers || 0}
              <span className="text-xs font-normal text-neutral-400">
                {' '}
                / {analytics?.subscriptions?.maxSubscribers || 18}
              </span>
            </p>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex-1 bg-cream-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary-600 h-full rounded-full transition-all"
                  style={{ width: `${analytics?.subscriptions?.occupancyPercentage || 0}%` }}
                />
              </div>
              <span className="text-[10px] text-neutral-500 font-semibold">
                {analytics?.subscriptions?.occupancyPercentage || 0}%
              </span>
            </div>
          </Card>

          {/* Pending Requests */}
          <Card className="p-4 sm:p-5 border-cream-300 bg-white">
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Requests</span>
              <div className="w-8 h-8 rounded-xl bg-saffron-50 text-saffron-700 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-serif font-bold text-neutral-900">
              {analytics?.subscriptions?.pendingRequests || 0}
            </p>
            <Link to="/chef/requests" className="text-[11px] text-primary-700 font-bold hover:underline mt-1 block">
              Review pending requests &rarr;
            </Link>
          </Card>
        </div>
      )}

      {/* Kitchen Queue Status Banner */}
      <Card className="p-5 border-cream-300 bg-cream-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-base text-neutral-900">
            Today's Preparation Progress
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time status updates broadcast automatically to subscriber screens
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800">
            <span>Reserved: {reservedCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800">
            <span>Preparing: {preparingCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
            <span>Ready for Pickup: {readyCount}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700">
            <span>Picked Up: {pickedUpCount}</span>
          </div>

          <Link to="/chef/queue">
            <Button variant="outline" size="sm">
              Open Full Board
            </Button>
          </Link>
        </div>
      </Card>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reservation Trends Chart (Last 7 Days) */}
        <Card className="p-5 sm:p-6 border-cream-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-neutral-900">
                7-Day Reservation Trends
              </h3>
              <p className="text-xs text-neutral-500">Daily volume of reserved and collected meals</p>
            </div>
            <TrendingUp className="w-4 h-4 text-primary-600" />
          </div>

          <div className="h-64 w-full">
            {analytics?.reservationTrends && analytics.reservationTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.reservationTrends}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPicked" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E89F18" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#E89F18" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="_id" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="totalReservations"
                    name="Reserved"
                    stroke="#2E7D32"
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="pickedUp"
                    name="Picked Up"
                    stroke="#E89F18"
                    fillOpacity={1}
                    fill="url(#colorPicked)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-neutral-400">
                Not enough reservation history yet
              </div>
            )}
          </div>
        </Card>

        {/* Most Ordered Dishes */}
        <Card className="p-5 sm:p-6 border-cream-300">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif font-bold text-base text-neutral-900">
                Most Popular Dishes
              </h3>
              <p className="text-xs text-neutral-500">Highest volume meals prepared by order count</p>
            </div>
            <UtensilsCrossed className="w-4 h-4 text-saffron-600" />
          </div>

          <div className="h-64 w-full">
            {analytics?.mostOrderedMeals && analytics.mostOrderedMeals.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.mostOrderedMeals} layout="vertical">
                  <XAxis type="number" stroke="#888888" fontSize={11} allowDecimals={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#888888"
                    fontSize={11}
                    width={110}
                    tickFormatter={(v) => (v.length > 15 ? `${v.slice(0, 15)}...` : v)}
                  />
                  <Tooltip />
                  <Bar dataKey="count" name="Orders" fill="#2E7D32" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-neutral-400">
                No orders recorded yet
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Rotate Kitchen Code Modal */}
      <Modal
        isOpen={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
        title="Change Kitchen Pass Code"
        description="Your kitchen code forms the prefix of subscriber pickup passes. You can specify a custom 4-10 char code or leave empty for a new random code."
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            rotateCodeMutation.mutate(newCodeInput.trim());
          }}
          className="space-y-4"
        >
          <Input
            label="New Kitchen Code"
            placeholder="e.g. CHF-4521"
            value={newCodeInput}
            onChange={(e) => setNewCodeInput(e.target.value.toUpperCase())}
            helperText="Leave blank to auto-generate a fresh CHF-XXXX code."
          />

          <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 border border-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p>
              Rotating your kitchen code will automatically update all pending and unpicked reservations with the new token and notify subscribers.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setCodeModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={rotateCodeMutation.isPending}>
              Update Kitchen Code
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

