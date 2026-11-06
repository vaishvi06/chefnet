import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  QrCode,
  Calendar,
  Clock,
  MapPin,
  UtensilsCrossed,
  Star,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reservationApi } from '../../api/reservationApi';
import { subscriptionApi } from '../../api/subscriptionApi';
import { dailyMenuApi } from '../../api/dailyMenuApi';
import { reviewApi } from '../../api/reviewApi';
import { complaintApi } from '../../api/complaintApi';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { StatusStepper } from '../../components/ui/StatusStepper';
import { RatingStars } from '../../components/ui/RatingStars';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { QrPass } from '../../components/shared/QrPass';
import { QueryErrorState } from '../../components/shared/QueryErrorState';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';
import { COMPLAINT_CATEGORIES } from '../../utils/constants';

export const ReservationsPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'completed'
  const [qrModalRes, setQrModalRes] = useState(null);
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [reviewModalRes, setReviewModalRes] = useState(null);
  const [complaintModalRes, setComplaintModalRes] = useState(null);

  // New reservation form state
  const [selectedSubId, setSelectedSubId] = useState(searchParams.get('subId') || '');
  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [selectedMealId, setSelectedMealId] = useState('');

  // Review form state
  const [ratings, setRatings] = useState({
    foodQuality: 5,
    foodQuantity: 5,
    hygiene: 5,
    overall: 5
  });
  const [reviewComment, setReviewComment] = useState('');

  // Complaint form state
  const [complaintCategory, setComplaintCategory] = useState('food_quality');
  const [complaintDesc, setComplaintDesc] = useState('');

  // Query reservations
  const { data: resData, isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => reservationApi.getReservations({ limit: 50 }),
    staleTime: 15000
  });

  // Query active subscriptions for the reserve modal
  const { data: subData } = useQuery({
    queryKey: ['subscriptions', 'active'],
    queryFn: () => subscriptionApi.getSubscriptions({ status: 'active' }),
    enabled: reserveModalOpen || !!searchParams.get('subId')
  });

  const activeSubscriptions = subData?.data?.subscriptions || [];
  const selectedSub = activeSubscriptions.find((s) => s._id === selectedSubId);

  // Query menus for selected chef
  const { data: menuData } = useQuery({
    queryKey: ['dailyMenus', selectedSub?.chef?._id],
    queryFn: () =>
      dailyMenuApi.getDailyMenus({
        chef: selectedSub?.chef?._id,
        mealType: selectedSub?.mealPlan === 'full_day' ? undefined : selectedSub?.mealPlan
      }),
    enabled: !!selectedSub?.chef?._id
  });

  const availableMenus = menuData?.data?.dailyMenus || [];
  const selectedMenu = availableMenus.find((m) => m._id === selectedMenuId);

  const reservations = resData?.data?.reservations || [];
  const upcomingReservations = reservations.filter((r) =>
    ['reserved', 'preparing', 'ready'].includes(r.status)
  );
  const pastReservations = reservations.filter((r) =>
    ['picked_up', 'missed', 'cancelled'].includes(r.status)
  );

  // Create Reservation Mutation
  const createReservationMutation = useMutation({
    mutationFn: (data) => reservationApi.createReservation(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setReserveModalOpen(false);
      setSelectedMenuId('');
      setSelectedMealId('');
      toast.success('Meal reserved successfully! Here is your pickup pass.');
      if (res.data?.reservation) {
        setQrModalRes(res.data.reservation);
      }
    },
    onError: (err) => toast.error(err.message || 'Could not create reservation')
  });

  // Cancel Reservation Mutation
  const cancelReservationMutation = useMutation({
    mutationFn: (id) => reservationApi.updateReservationStatus(id, 'cancelled'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast.success('Reservation cancelled');
    },
    onError: (err) => toast.error(err.message || 'Failed to cancel reservation')
  });

  // Review Mutation
  const submitReviewMutation = useMutation({
    mutationFn: (data) => reviewApi.createReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      setReviewModalRes(null);
      setReviewComment('');
      toast.success('Thank you! Your feedback has been posted.');
    },
    onError: (err) => toast.error(err.message || 'Failed to submit review')
  });

  // Complaint Mutation
  const submitComplaintMutation = useMutation({
    mutationFn: (data) => complaintApi.createComplaint(data),
    onSuccess: () => {
      setComplaintModalRes(null);
      setComplaintDesc('');
      toast.success('Complaint submitted to platform moderators.');
    },
    onError: (err) => toast.error(err.message || 'Failed to submit complaint')
  });

  const currentList = activeTab === 'upcoming' ? upcomingReservations : pastReservations;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
            Reservations & Pickups
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Reserve today's dishes, track kitchen preparation, and present your QR pickup pass.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setReserveModalOpen(true);
            if (activeSubscriptions.length > 0 && !selectedSubId) {
              setSelectedSubId(activeSubscriptions[0]._id);
            }
          }}
          icon={PlusCircle}
        >
          Reserve a Meal
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cream-200">
        <button
          type="button"
          onClick={() => setActiveTab('upcoming')}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'upcoming'
              ? 'border-primary-600 text-primary-800 bg-primary-50/50'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <span>Active & Upcoming</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cream-200 text-neutral-600 font-bold">
            {upcomingReservations.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'completed'
              ? 'border-primary-600 text-primary-800 bg-primary-50/50'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <span>History & Missed</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cream-200 text-neutral-600 font-bold">
            {pastReservations.length}
          </span>
        </button>
      </div>

      {/* Loading */}
      {isLoading && <Skeleton variant="card" count={2} />}

      {/* Empty State */}
      {!isLoading && currentList.length === 0 && (
        <EmptyState
          icon={QrCode}
          title={activeTab === 'upcoming' ? 'No Active Reservations' : 'No Pickup History'}
          description={
            activeTab === 'upcoming'
              ? 'You have not reserved any meals for today. Reserve from your active subscriptions before the daily kitchen cutoff time.'
              : 'You have not completed any pickups yet.'
          }
          actionLabel="Reserve a Meal"
          onAction={() => setReserveModalOpen(true)}
        />
      )}

      {/* Reservations List */}
      {!isLoading && currentList.length > 0 && (
        <div className="space-y-4">
          {currentList.map((res) => {
            const isReady = res.status === 'ready';

            return (
              <Card key={res._id} className="p-5 sm:p-6 border-cream-300 space-y-4 shadow-warm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-bold text-lg text-neutral-900">
                        {res.meal?.name || 'Home Meal'}
                      </h3>
                      <Badge variant="primary" size="sm" className="capitalize">
                        {res.mealType}
                      </Badge>
                      <span className="text-sm font-bold text-primary-800">
                        {formatCurrency(res.price)}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-500">
                      Kitchen: <strong className="text-neutral-800">{res.chef?.chefProfile?.kitchenName || res.chef?.name}</strong> • {res.chef?.address}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600 pt-1">
                      <span className="flex items-center gap-1 font-semibold text-neutral-700">
                        <Calendar className="w-3.5 h-3.5 text-primary-600" />
                        {formatDate(res.reserveDate, 'EEE, dd MMM yyyy')}
                      </span>
                      {res.dailyMenu && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-saffron-600" />
                          Pickup Window: {formatTime(res.dailyMenu.pickupStart)} – {formatTime(res.dailyMenu.pickupEnd)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pass Button */}
                  <div className="self-start sm:self-auto shrink-0">
                    {['reserved', 'preparing', 'ready'].includes(res.status) && (
                      <Button
                        variant={isReady ? 'primary' : 'outline'}
                        size="sm"
                        icon={QrCode}
                        onClick={() => setQrModalRes(res)}
                        className={isReady ? 'ring-4 ring-emerald-100 shadow-md animate-pulse' : ''}
                      >
                        <span>{isReady ? 'Flash QR Pass (Ready!)' : 'Show Pickup Pass'}</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Status Stepper */}
                <div className="pt-2 border-t border-cream-200">
                  <StatusStepper currentStatus={res.status} isMissed={res.isMissed} />
                </div>

                {/* Action Footer */}
                <div className="pt-2 border-t border-cream-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="text-neutral-400 font-mono text-[11px]">
                    Token: {res.qrToken ? `${res.qrToken.slice(0, 12)}...` : 'N/A'}
                  </div>

                  <div className="flex items-center gap-2">
                    {res.status === 'reserved' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-terracotta-600 hover:bg-terracotta-50 text-xs"
                        onClick={() => cancelReservationMutation.mutate(res._id)}
                        loading={cancelReservationMutation.isPending}
                      >
                        Cancel Reservation
                      </Button>
                    )}

                    {res.status === 'picked_up' && (
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Star}
                        onClick={() => setReviewModalRes(res)}
                        className="text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                      >
                        Rate & Review
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-neutral-500 hover:text-neutral-800 text-xs"
                      onClick={() => setComplaintModalRes(res)}
                    >
                      Report an Issue
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* QR Pass Modal */}
      {qrModalRes && (
        <Modal
          isOpen={!!qrModalRes}
          onClose={() => setQrModalRes(null)}
          title="Digital Self-Pickup Pass"
          maxWidth="max-w-md"
        >
          <QrPass
            qrToken={qrModalRes.qrToken}
            mealName={qrModalRes.meal?.name}
            mealType={qrModalRes.mealType}
            reserveDate={formatDate(qrModalRes.reserveDate, 'EEE, dd MMM yyyy')}
            pickupWindow={
              qrModalRes.dailyMenu
                ? { start: qrModalRes.dailyMenu.pickupStart, end: qrModalRes.dailyMenu.pickupEnd }
                : null
            }
            chefName={qrModalRes.chef?.name}
            chefKitchen={qrModalRes.chef?.chefProfile?.kitchenName}
            chefAddress={qrModalRes.chef?.address}
            status={qrModalRes.status}
          />

          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" onClick={() => setQrModalRes(null)}>
              Close Pass
            </Button>
          </div>
        </Modal>
      )}

      {/* Reserve Meal Modal */}
      <Modal
        isOpen={reserveModalOpen}
        onClose={() => setReserveModalOpen(false)}
        title="Reserve Meal from Chef's Daily Menu"
        description="Choose from active menus with live cutoff timers. Cutoff window strictly enforced for fresh cooking."
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {activeSubscriptions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-neutral-600 mb-3">
                You do not have any active subscriptions. Please subscribe to a verified kitchen first.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setReserveModalOpen(false);
                  window.location.href = '/discover';
                }}
              >
                Browse Kitchens
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selectedSub || !selectedMenu || !selectedMealId) {
                  toast.error('Please complete all selection fields');
                  return;
                }
                createReservationMutation.mutate({
                  subscriptionId: selectedSub._id,
                  dailyMenuId: selectedMenu._id,
                  mealId: selectedMealId,
                  reserveDate: selectedMenu.menuDate,
                  mealType: selectedMenu.mealType
                });
              }}
              className="space-y-4"
            >
              {/* Select Active Subscription */}
              <Select
                label="Select Kitchen Plan"
                value={selectedSubId}
                onChange={(e) => {
                  setSelectedSubId(e.target.value);
                  setSelectedMenuId('');
                  setSelectedMealId('');
                }}
                options={activeSubscriptions.map((s) => ({
                  value: s._id,
                  label: `${s.chef?.chefProfile?.kitchenName || s.chef?.name} (${s.planType} - ${s.mealPlan?.replace('_', ' ')})`
                }))}
                required
              />

              {/* Select Daily Menu */}
              {selectedSub && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Available Menus
                  </label>

                  {availableMenus.length === 0 ? (
                    <p className="text-xs text-neutral-500 p-3 bg-cream-100 rounded-xl">
                      This chef hasn't published menus for your plan time yet.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {availableMenus.map((m) => {
                        const isPastCutoff = new Date(m.cutoffTime) < new Date();
                        const isSoldOut = m.quantityAvailable <= 0;
                        const disabled = isPastCutoff || isSoldOut;

                        return (
                          <div
                            key={m._id}
                            onClick={() => !disabled && setSelectedMenuId(m._id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer ${
                              selectedMenuId === m._id
                                ? 'border-primary-600 bg-primary-50/60 ring-2 ring-primary-500/20'
                                : disabled
                                ? 'border-neutral-200 bg-neutral-100 opacity-60 cursor-not-allowed'
                                : 'border-cream-300 hover:border-primary-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-neutral-800 capitalize">
                                {m.mealType} • {formatDate(m.menuDate, 'EEE, dd MMM')}
                              </span>
                              <CountdownTimer cutoffTime={m.cutoffTime} />
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-500">
                              <span>Pickup: {formatTime(m.pickupStart)} – {formatTime(m.pickupEnd)}</span>
                              <span>{isSoldOut ? 'Sold out' : `${m.quantityAvailable} available`}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Select Meal Dish inside Chosen Menu */}
              {selectedMenu && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Choose Dish
                  </label>
                  <div className="space-y-2">
                    {selectedMenu.meals?.map((meal) => (
                      <div
                        key={meal._id}
                        onClick={() => setSelectedMealId(meal._id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          selectedMealId === meal._id
                            ? 'border-primary-600 bg-primary-50/60 ring-2 ring-primary-500/20'
                            : 'border-cream-300 hover:border-primary-300 bg-white'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-xs text-neutral-900">{meal.name}</p>
                          <p className="text-[11px] text-neutral-500">{meal.description}</p>
                        </div>
                        <span className="font-bold text-primary-800 text-sm shrink-0">
                          {formatCurrency(meal.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setReserveModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!selectedMealId}
                  loading={createReservationMutation.isPending}
                >
                  Confirm Reservation & Generate Pass
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Rate & Review Modal */}
      {reviewModalRes && (
        <Modal
          isOpen={!!reviewModalRes}
          onClose={() => setReviewModalRes(null)}
          title="Rate Your Homemade Meal"
          description={`Leave genuine feedback for ${reviewModalRes.chef?.name}'s cooking and hygiene.`}
          maxWidth="max-w-md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitReviewMutation.mutate({
                reservationId: reviewModalRes._id,
                ratings,
                comment: reviewComment
              });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Overall Experience (1-5 Stars)
              </label>
              <RatingStars
                value={ratings.overall}
                interactive={true}
                size="lg"
                onChange={(val) => setRatings({ ...ratings, overall: val })}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cream-200">
              <div>
                <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                  Food Quality
                </label>
                <RatingStars
                  value={ratings.foodQuality}
                  interactive={true}
                  size="sm"
                  onChange={(val) => setRatings({ ...ratings, foodQuality: val })}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                  Food Quantity
                </label>
                <RatingStars
                  value={ratings.foodQuantity}
                  interactive={true}
                  size="sm"
                  onChange={(val) => setRatings({ ...ratings, foodQuantity: val })}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                  Hygiene
                </label>
                <RatingStars
                  value={ratings.hygiene}
                  interactive={true}
                  size="sm"
                  onChange={(val) => setRatings({ ...ratings, hygiene: val })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Review Comments (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="How was the taste, packaging, and pickup punctuality?"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full rounded-xl border border-cream-300 p-2.5 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setReviewModalRes(null)}>
                Skip
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={submitReviewMutation.isPending}
              >
                Post Review
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Report a Problem / Complaint Modal */}
      {complaintModalRes && (
        <Modal
          isOpen={!!complaintModalRes}
          onClose={() => setComplaintModalRes(null)}
          title="Report an Issue to ChiefNet"
          description="Our neighborhood moderators investigate all reports thoroughly to ensure food safety and trust."
          maxWidth="max-w-md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!complaintDesc.trim()) {
                toast.error('Please describe the issue');
                return;
              }
              submitComplaintMutation.mutate({
                againstId: complaintModalRes.chef?._id || complaintModalRes.chef,
                reservationId: complaintModalRes._id,
                category: complaintCategory,
                description: complaintDesc.trim()
              });
            }}
            className="space-y-4"
          >
            <Select
              label="Complaint Category"
              value={complaintCategory}
              onChange={(e) => setComplaintCategory(e.target.value)}
              options={COMPLAINT_CATEGORIES}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Description of the Problem
              </label>
              <textarea
                rows={4}
                required
                placeholder="Please describe what happened in detail..."
                value={complaintDesc}
                onChange={(e) => setComplaintDesc(e.target.value)}
                className="w-full rounded-xl border border-cream-300 p-2.5 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setComplaintModalRes(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="md"
                loading={submitComplaintMutation.isPending}
              >
                Submit Report
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

