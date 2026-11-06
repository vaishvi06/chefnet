import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  MessageSquare,
  Phone,
  Star,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  UserX,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { subscriptionApi } from '../../api/subscriptionApi';
import { reviewApi } from '../../api/reviewApi';
import { chefApi } from '../../api/chefApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { RatingStars } from '../../components/ui/RatingStars';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/formatters';

export const ChefSubscribersPage = () => {
  const queryClient = useQueryClient();
  const [ratingModalSub, setRatingModalSub] = useState(null);
  const [removeModalSub, setRemoveModalSub] = useState(null);
  const [removeReason, setRemoveReason] = useState('');
  const [ratings, setRatings] = useState({
    punctuality: 5,
    communication: 5,
    reliability: 5
  });
  const [comment, setComment] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['chefActiveSubscribers'],
    queryFn: () => subscriptionApi.getSubscriptions({ status: 'active' })
  });

  // Query completed reservations to find one for customer review
  const { data: resData } = useQuery({
    queryKey: ['chefPickedReservations'],
    queryFn: () => chefApi.getChefReservations()
  });

  const subscribers = data?.data?.subscriptions || [];
  const allReservations = resData?.data?.reservations || [];

  const rateCustomerMutation = useMutation({
    mutationFn: (payload) => reviewApi.createReview(payload),
    onSuccess: () => {
      setRatingModalSub(null);
      setComment('');
      toast.success('Customer rated successfully! Updates their Trust Score.');
    },
    onError: (err) => toast.error(err.message || 'Failed to submit customer review')
  });

  const removeSubscriberMutation = useMutation({
    mutationFn: ({ id, reason }) => chefApi.removeSubscriber(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chefActiveSubscribers'] });
      setRemoveModalSub(null);
      setRemoveReason('');
      toast.success('Subscriber removed and future reservations cancelled.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to remove subscriber');
    }
  });

  const handleOpenRate = (sub) => {
    // Find a completed reservation for this customer
    const completedRes = allReservations.find(
      (r) => (r.customer?._id === sub.customer?._id || r.customer === sub.customer?._id) && ['picked_up', 'missed'].includes(r.status)
    );

    if (!completedRes) {
      toast.error('Customer can only be rated after their first meal pickup is completed.');
      return;
    }

    setRatingModalSub({
      sub,
      reservationId: completedRes._id
    });
  };

  const handleOpenRemove = (sub) => {
    setRemoveReason('');
    setRemoveModalSub(sub);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
          Active Subscribers & Community
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Your neighborhood subscribers who enjoy your home cooking daily.
        </p>
      </div>

      {isLoading ? (
        <Skeleton variant="card" count={3} />
      ) : subscribers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No Active Subscribers Yet"
          description="Pending subscription requests will show up under 'Requests'. Once accepted, your subscribers appear here with direct chat and phone contacts."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscribers.map((sub) => (
            <Card key={sub._id} className="p-5 border-cream-300 space-y-4 shadow-warm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-800 font-bold flex items-center justify-center text-base uppercase shrink-0">
                    {sub.customer?.name?.charAt(0) || 'U'}
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-base text-neutral-900">
                      {sub.customer?.name || 'Neighbour'}
                    </h3>
                    <p className="text-xs text-neutral-500 line-clamp-1">
                      {sub.customer?.address || 'Pickup walking radius'}
                    </p>

                    <div className="flex items-center gap-2 mt-1.5 text-xs">
                      <span className="flex items-center gap-1 font-semibold text-neutral-800">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        {sub.customer?.ratingAverage ? Number(sub.customer.ratingAverage).toFixed(1) : '5.0'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Trust: {sub.customer?.trustScore ?? 100}%
                      </span>
                    </div>
                  </div>
                </div>

                <Badge variant="success" size="sm" dot>
                  Active
                </Badge>
              </div>

              {/* Plan & Contact row */}
              <div className="p-3 bg-cream-50 rounded-xl border border-cream-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Plan:</span>
                  <span className="font-bold capitalize text-neutral-800">
                    {sub.planType} ({sub.mealPlan?.replace('_', ' ')})
                  </span>
                </div>
                {sub.customer?.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Phone:</span>
                    <a
                      href={`tel:${sub.customer.phone}`}
                      className="font-bold text-primary-800 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{sub.customer.phone}</span>
                    </a>
                  </div>
                )}
                {sub.endDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Active Until:</span>
                    <span className="text-neutral-700">{formatDate(sub.endDate)}</span>
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="pt-2 border-t border-cream-200 flex items-center justify-between gap-2">
                <Link to={`/chat/${sub._id}`}>
                  <Button variant="outline" size="sm" icon={MessageSquare}>
                    Chat
                  </Button>
                </Link>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Star}
                    onClick={() => handleOpenRate(sub)}
                    className="text-xs text-amber-800 hover:bg-amber-50"
                  >
                    Rate
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={UserX}
                    onClick={() => handleOpenRemove(sub)}
                    className="text-xs text-rose-700 hover:bg-rose-50"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Remove Subscriber Modal */}
      {removeModalSub && (
        <Modal
          isOpen={!!removeModalSub}
          onClose={() => setRemoveModalSub(null)}
          title={`Remove Subscriber: ${removeModalSub.customer?.name || 'Customer'}`}
          description="Removing a subscriber cancels their active subscription and any upcoming unpicked reservations, freeing up your kitchen capacity."
          maxWidth="max-w-md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (removeReason.trim().length < 5) {
                toast.error('Please provide a reason with at least 5 characters');
                return;
              }
              removeSubscriberMutation.mutate({
                id: removeModalSub._id,
                reason: removeReason.trim()
              });
            }}
            className="space-y-4"
          >
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                The subscriber will be notified with your reason. Any meals scheduled for today or later will be cancelled automatically.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Reason for Removal <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g., Repeated pickup no-shows, customer relocated outside pickup area..."
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                className="w-full rounded-xl border border-cream-300 p-2.5 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <p className="text-[10px] text-neutral-400 mt-1">Minimum 5 characters required.</p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRemoveModalSub(null)}
                disabled={removeSubscriberMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="md"
                loading={removeSubscriberMutation.isPending}
                disabled={removeReason.trim().length < 5}
              >
                Confirm Removal
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Rate Customer Modal */}
      {ratingModalSub && (
        <Modal
          isOpen={!!ratingModalSub}
          onClose={() => setRatingModalSub(null)}
          title={`Rate ${ratingModalSub.sub?.customer?.name || 'Customer'}`}
          description="Rate this subscriber on pickup punctuality and communication. This updates their public Trust Score."
          maxWidth="max-w-md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              rateCustomerMutation.mutate({
                reservationId: ratingModalSub.reservationId,
                ratings,
                comment
              });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Pickup Punctuality
              </label>
              <RatingStars
                value={ratings.punctuality}
                interactive={true}
                size="md"
                onChange={(val) => setRatings({ ...ratings, punctuality: val })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Communication & Courtesy
              </label>
              <RatingStars
                value={ratings.communication}
                interactive={true}
                size="md"
                onChange={(val) => setRatings({ ...ratings, communication: val })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Reliability
              </label>
              <RatingStars
                value={ratings.reliability}
                interactive={true}
                size="md"
                onChange={(val) => setRatings({ ...ratings, reliability: val })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Notes / Feedback (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Always on time, polite..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-xl border border-cream-300 p-2.5 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setRatingModalSub(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={rateCustomerMutation.isPending}
              >
                Submit Rating
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

