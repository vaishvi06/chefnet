import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Layers,
  MapPin,
  UtensilsCrossed,
  ShieldCheck,
  AlertTriangle,
  Star,
  TrendingUp,
  Percent
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { adminApi } from '../../api/adminApi';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';

export const AdminOverviewPage = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: adminApi.getAdminAnalytics,
    refetchInterval: 30000
  });

  const analytics = data?.data;

  const planChartData = [
    { name: 'Weekly Plans', count: analytics?.subscriptions?.planDistribution?.weekly || 0 },
    { name: 'Monthly Plans', count: analytics?.subscriptions?.planDistribution?.monthly || 0 }
  ];

  const COLORS = ['#2E7D32', '#E89F18'];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
            Platform Operations & Analytics
          </h1>
          <Badge variant="danger" size="sm">
            Admin Console
          </Badge>
        </div>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Real-time health metrics, area activation thresholds, and verified household growth.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton variant="card" count={4} />
        </div>
      ) : isError ? (
        <Card className="p-6 text-center text-terracotta-700 bg-terracotta-50">
          <p>{error?.message || 'Failed to load platform analytics'}</p>
        </Card>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Verified Households */}
            <Card className="p-5 border-cream-300 bg-white space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Verified Households
                </span>
                <Users className="w-4 h-4 text-primary-600" />
              </div>
              <p className="text-3xl font-serif font-bold text-neutral-900">
                {analytics?.households?.verifiedHouseholds || 0}
              </p>
              <p className="text-[11px] text-neutral-500">
                {analytics?.households?.verifiedChefs || 0} chefs • {analytics?.households?.verifiedCustomers || 0} customers
              </p>
            </Card>

            {/* Active Subscriptions */}
            <Card className="p-5 border-cream-300 bg-white space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Active Subscriptions
                </span>
                <Layers className="w-4 h-4 text-saffron-600" />
              </div>
              <p className="text-3xl font-serif font-bold text-neutral-900">
                {analytics?.subscriptions?.activeSubscriptions || 0}
              </p>
              <p className="text-[11px] text-neutral-500">
                Weekly: {analytics?.subscriptions?.planDistribution?.weekly || 0} | Monthly: {analytics?.subscriptions?.planDistribution?.monthly || 0}
              </p>
            </Card>

            {/* Pickup Completion Rate */}
            <Card className="p-5 border-cream-300 bg-white space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Pickup Success Rate
                </span>
                <Percent className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-serif font-bold text-emerald-800">
                {analytics?.reservations?.pickupCompletionRate || 0}%
              </p>
              <p className="text-[11px] text-neutral-500">
                {analytics?.reservations?.pickedUp || 0} picked up of {analytics?.reservations?.volume || 0} reservations
              </p>
            </Card>

            {/* Area Health */}
            <Card className="p-5 border-cream-300 bg-white space-y-1">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                  Geofenced Areas
                </span>
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-3xl font-serif font-bold text-neutral-900">
                {analytics?.areas?.activeAreas || 0}
                <span className="text-xs font-normal text-neutral-400">
                  {' '}
                  / {analytics?.areas?.totalAreas || 0} Live
                </span>
              </p>
              <p className="text-[11px] text-amber-700 font-semibold">
                {analytics?.areas?.waitingAreas || 0} waiting threshold
              </p>
            </Card>
          </div>

          {/* Secondary Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-cream-50 border-cream-300 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Star className="w-5 h-5 fill-amber-400" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Avg Household Rating</p>
                <p className="text-xl font-serif font-bold text-neutral-900">
                  ⭐ {Number(analytics?.averageHouseholdRating || 4.8).toFixed(2)} / 5.0
                </p>
              </div>
            </Card>

            <Card className="p-4 bg-cream-50 border-cream-300 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Complaint Rate</p>
                <p className="text-xl font-serif font-bold text-neutral-900">
                  {analytics?.complaints?.complaintRate || 0}% ({analytics?.complaints?.total || 0} reports)
                </p>
              </div>
            </Card>

            <Card className="p-4 bg-cream-50 border-cream-300 flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Missed Pickups</p>
                <p className="text-xl font-serif font-bold text-neutral-900">
                  {analytics?.reservations?.missed || 0} missed
                </p>
              </div>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Household Growth */}
            <Card className="p-5 sm:p-6 border-cream-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-neutral-900">
                    Household Growth (Past 6 Months)
                  </h3>
                  <p className="text-xs text-neutral-500">Monthly new registered foodies and home chefs</p>
                </div>
                <TrendingUp className="w-4 h-4 text-primary-600" />
              </div>

              <div className="h-64 w-full">
                {analytics?.households?.growth && analytics.households.growth.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.households.growth}>
                      <defs>
                        <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="_id" stroke="#888888" fontSize={11} />
                      <YAxis stroke="#888888" fontSize={11} allowDecimals={false} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="total"
                        name="New Households"
                        stroke="#2E7D32"
                        fillOpacity={1}
                        fill="url(#colorCustomers)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-neutral-400">
                    No historical growth periods recorded yet
                  </div>
                )}
              </div>
            </Card>

            {/* Weekly vs Monthly Plan Distribution */}
            <Card className="p-5 sm:p-6 border-cream-300">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-neutral-900">
                    Subscription Plan Distribution
                  </h3>
                  <p className="text-xs text-neutral-500">Comparison of weekly vs monthly subscriptions</p>
                </div>
                <Layers className="w-4 h-4 text-saffron-600" />
              </div>

              <div className="h-64 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={planChartData}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                    <YAxis stroke="#888888" fontSize={11} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Active Subscribers" fill="#2E7D32" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

