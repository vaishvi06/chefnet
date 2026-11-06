import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, CheckCircle2, XCircle, Star, ShieldCheck, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { subscriptionApi } from '../../api/subscriptionApi';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/formatters';

export const SubscriptionRequestsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['pendingSubscriptions'],
    queryFn: () => subscriptionApi.getSubscriptions({ status: 'pending' }),
    staleTime: 15000
  });

  const pendingRequests = data?.data?.subscriptions || [];
  const maxSubs = user?.chefProfile?.maxSubscribers || 18;
  const isFull = user?.chefProfile?.availabilityStatus === 'full';

  // Accept Mutation
  const acceptMutation = useMutation({
    mutationFn: (id) => subscriptionApi.acceptSubscription(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['pendingSubscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['chefDashboardAnalytics'] });
      toast.success(res.message || 'Subscription accepted! Direct chat unlocked.');
    },
    onError: (err) => toast.error(err.message || 'Failed to accept subscription')
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: (id) => subscriptionApi.rejectSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingSubscriptions'] });
      toast.success('Subscription declined');
    },
    onError: (err) => toast.error(err.message || 'Failed to decline subscription')
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
          Subscription Requests
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Neighbours waiting to subscribe to your daily home cooking. Review their trust score and accept.
        </p>
      </div>

      {/* Capacity status alert */}
      {isFull && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl text-rose-900 text-xs sm:text-sm flex items-center gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>
            <strong>Kitchen Capacity Reached:</strong> You have reached your maximum active subscriber limit ({maxSubs}). Increase capacity in Kitchen Settings before accepting new requests.
          </span>
        </div>
      )}

      {isLoading ? (
        <Skeleton variant="card" count={3} />
      ) : pendingRequests.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No Pending Requests"
          description="You are caught up! When nearby foodies within 1 km request a meal plan, they will appear here."
        />
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((req) => (
            <Card key={req._id} className="p-5 sm:p-6 border-cream-300 space-y-4 shadow-warm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-saffron-100 text-saffron-800 flex items-center justify-center font-bold text-base shrink-0">
                    <User className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-base text-neutral-900">
                      {req.customer?.name || 'Customer'}
                    </h3>
                    <p className="text-xs text-neutral-500">
                      Neighbourhood Address: {req.customer?.address || 'Within 1 km radius'}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <div className="flex items-center gap-1 font-semibold text-neutral-800">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span>{req.customer?.ratingAverage ? Number(req.customer.ratingAverage).toFixed(1) : '5.0'}</span>
                      </div>

                      <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Trust Score: {req.customer?.trustScore ?? 100}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Badge variant="warning" size="sm">
                  Requested on {formatDate(req.createdAt)}
                </Badge>
              </div>

              {/* Plan Details Box */}
              <div className="p-3 bg-cream-50 rounded-xl border border-cream-200 flex flex-wrap items-center justify-between text-xs">
                <span>
                  Plan Duration: <strong className="capitalize text-neutral-800">{req.planType} ({req.planType === 'weekly' ? '7 Days' : '30 Days'})</strong>
                </span>
                <span>
                  Meal Coverage: <strong className="capitalize text-neutral-800">{req.mealPlan?.replace('_', ' ')}</strong>
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-cream-200 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-terracotta-700 border-terracotta-200 hover:bg-terracotta-50"
                  icon={XCircle}
                  loading={rejectMutation.isPending}
                  onClick={() => rejectMutation.mutate(req._id)}
                >
                  Decline
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  icon={CheckCircle2}
                  disabled={isFull}
                  loading={acceptMutation.isPending}
                  onClick={() => acceptMutation.mutate(req._id)}
                >
                  Accept Subscription
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

