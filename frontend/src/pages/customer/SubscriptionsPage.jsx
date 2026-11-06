import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  PauseCircle,
  PlayCircle,
  XCircle,
  MessageSquare,
  Calendar,
  AlertTriangle,
  Clock,
  Phone,
  CheckCircle2,
  CalendarPlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { subscriptionApi } from '../../api/subscriptionApi';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { QueryErrorState } from '../../components/shared/QueryErrorState';
import { SUBSCRIPTION_STATUSES } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

export const SubscriptionsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'pending' | 'past'
  const [pauseSub, setPauseSub] = useState(null);
  const [pauseDates, setPauseDates] = useState({ from: '', to: '', reason: '' });
  const [cancelSub, setCancelSub] = useState(null);
  const [cancelOption, setCancelOption] = useState('immediate');

  const { data: subData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionApi.getSubscriptions({ limit: 50 }),
    staleTime: 30000
  });

  const subscriptions = subData?.data?.subscriptions || [];

  // Filter subscriptions according to tab
  const activeSubs = subscriptions.filter((s) => ['active', 'accepted', 'paused'].includes(s.status));
  const pendingSubs = subscriptions.filter((s) => s.status === 'pending');
  const pastSubs = subscriptions.filter((s) => ['cancelled', 'rejected', 'expired'].includes(s.status));

  // Mutations
  const pauseMutation = useMutation({
    mutationFn: ({ id, data }) => subscriptionApi.pauseSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setPauseSub(null);
      toast.success('Subscription paused');
    },
    onError: (err) => toast.error(err.message || 'Failed to pause subscription')
  });

  const resumeMutation = useMutation({
    mutationFn: (id) => subscriptionApi.resumeSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success('Subscription resumed! You can now place meal reservations.');
    },
    onError: (err) => toast.error(err.message || 'Failed to resume subscription')
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, cancelOption }) => subscriptionApi.cancelSubscription(id, { cancelOption }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setCancelSub(null);
      toast.success('Subscription cancellation scheduled.');
    },
    onError: (err) => toast.error(err.message || 'Failed to cancel subscription')
  });

  const currentList = activeTab === 'active' ? activeSubs : activeTab === 'pending' ? pendingSubs : pastSubs;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
            My Subscriptions
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Manage your daily home kitchen meal plans, pause periods, and pickup schedules.
          </p>
        </div>

        <Link to="/customer/discover">
          <Button variant="primary" size="sm">
            <CalendarPlus className="w-4 h-4 mr-2" />
            <span>Discover More Kitchens</span>
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cream-200">
        {[
          { id: 'active', label: 'Active Plans', count: activeSubs.length },
          { id: 'pending', label: 'Pending Approval', count: pendingSubs.length },
          { id: 'past', label: 'Past / Cancelled', count: pastSubs.length }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-4 sm:px-6 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-800 bg-primary-50/50'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cream-200 text-neutral-600 font-bold">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Error State */}
      {isError && (
        <QueryErrorState
          error={error}
          onRetry={refetch}
          title="Could Not Load Subscriptions"
        />
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton variant="card" count={2} />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && currentList.length === 0 && (
        <EmptyState
          icon={Layers}
          title={`No ${activeTab} subscriptions`}
          description={
            activeTab === 'active'
              ? 'You do not have any active subscriptions right now. Browse verified home kitchens within 1 km to request a weekly or monthly tiffin plan.'
              : 'No subscription requests found in this tab.'
          }
          actionLabel="Find Food Within 1 km"
          onAction={() => window.location.href = '/customer/discover'}
        />
      )}

      {/* Subscription Cards List */}
      {!isLoading && currentList.length > 0 && (
        <div className="space-y-4">
          {currentList.map((sub) => {
            const statusConfig = SUBSCRIPTION_STATUSES[sub.status] || {
              label: sub.status,
              badge: 'bg-neutral-100 text-neutral-700'
            };

            // Calculate days remaining
            const daysRemaining = sub.endDate
              ? Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;

            const isNearExpiry = daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= 0;

            return (
              <Card key={sub._id} className="p-5 sm:p-6 border-cream-300 space-y-4 shadow-warm">
                {/* Expiry Reminder Banner */}
                {isNearExpiry && sub.status === 'active' && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Plan Expiring Soon:</strong> This subscription finishes in {daysRemaining} day(s) on {formatDate(sub.endDate)}. Connect with the chef to renew!
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-base shrink-0">
                      🍲
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif font-bold text-lg text-neutral-900">
                          {sub.chef?.chefProfile?.kitchenName || `${sub.chef?.name}'s Kitchen`}
                        </h3>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusConfig.badge}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-500 mt-0.5">
                        Chef: <strong className="text-neutral-700">{sub.chef?.name}</strong> • {sub.chef?.address}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 mt-2">
                        <span>
                          Plan: <strong className="capitalize">{sub.planType}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Meal: <strong className="capitalize">{sub.mealPlan?.replace('_', ' ')}</strong>
                        </span>
                        {sub.startDate && (
                          <>
                            <span>•</span>
                            <span>Started: {formatDate(sub.startDate)}</span>
                          </>
                        )}
                        {sub.endDate && (
                          <>
                            <span>•</span>
                            <span>Valid Until: {formatDate(sub.endDate)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Phone number after approval */}
                  {['active', 'accepted'].includes(sub.status) && (
                    <div className="p-2.5 rounded-xl bg-cream-100 border border-cream-200 text-xs self-start sm:self-auto shrink-0">
                      <div className="flex items-center gap-1.5 text-primary-800 font-bold">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{sub.chef?.phone || 'Contact Unlocked'}</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-0.5">Direct Chef Contact</p>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-cream-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {sub.status === 'active' && (
                      <Link to={`/customer/reservations?subId=${sub._id}`}>
                        <Button variant="primary" size="sm">
                          Reserve Daily Meal
                        </Button>
                      </Link>
                    )}

                    {['active', 'accepted'].includes(sub.status) && (
                      <Link to={`/chat/${sub._id}`}>
                        <Button variant="outline" size="sm" icon={MessageSquare}>
                          Chat with Chef
                        </Button>
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {sub.status === 'active' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={PauseCircle}
                        onClick={() => {
                          setPauseSub(sub);
                          setPauseDates({ from: '', to: '', reason: '' });
                        }}
                      >
                        Pause Plan
                      </Button>
                    )}

                    {sub.status === 'paused' && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={PlayCircle}
                        loading={resumeMutation.isPending}
                        onClick={() => resumeMutation.mutate(sub._id)}
                      >
                        Resume Plan
                      </Button>
                    )}

                    {['active', 'paused'].includes(sub.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-terracotta-600 hover:bg-terracotta-50"
                        icon={XCircle}
                        onClick={() => setCancelSub(sub)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pause Subscription Modal */}
      {pauseSub && (
        <Modal
          isOpen={!!pauseSub}
          onClose={() => setPauseSub(null)}
          title="Pause Your Meal Subscription"
          description="Going on vacation or taking a break? Set your pause period so the chef won't prepare meals for those days."
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              pauseMutation.mutate({
                id: pauseSub._id,
                data: pauseDates
              });
            }}
            className="space-y-4"
          >
            <Input
              label="Pause From Date"
              type="date"
              required
              value={pauseDates.from}
              onChange={(e) => setPauseDates({ ...pauseDates, from: e.target.value })}
            />

            <Input
              label="Resume On Date"
              type="date"
              required
              value={pauseDates.to}
              onChange={(e) => setPauseDates({ ...pauseDates, to: e.target.value })}
            />

            <Input
              label="Reason (Optional)"
              placeholder="e.g. Traveling out of station"
              value={pauseDates.reason}
              onChange={(e) => setPauseDates({ ...pauseDates, reason: e.target.value })}
            />

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPauseSub(null)}>
                Dismiss
              </Button>
              <Button type="submit" variant="primary" size="md" loading={pauseMutation.isPending}>
                Confirm Pause
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel Subscription Modal */}
      {cancelSub && (
        <ConfirmDialog
          isOpen={!!cancelSub}
          onClose={() => setCancelSub(null)}
          title="Cancel Subscription Plan"
          description="Please choose when you want this cancellation to take effect. If you have already paid the chef offline for this billing cycle, settling remaining balance is recommended."
          confirmText="Confirm Cancellation"
          loading={cancelMutation.isPending}
          onConfirm={() =>
            cancelMutation.mutate({
              id: cancelSub._id,
              cancelOption
            })
          }
        >
          <div className="mt-4">
            <Select
              label="Cancellation Timing"
              value={cancelOption}
              onChange={(e) => setCancelOption(e.target.value)}
              options={[
                { value: 'immediate', label: 'Immediately' },
                { value: 'after_week', label: 'At End of Current Week' },
                { value: 'after_month', label: 'At End of Current Month' }
              ]}
            />
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
};

