import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Users,
  UtensilsCrossed,
  Calendar,
  AlertCircle,
  Heart,
  ArrowLeft,
  Sparkles,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { discoveryApi } from '../../api/discoveryApi';
import { chefApi } from '../../api/chefApi';
import { subscriptionApi } from '../../api/subscriptionApi';
import { customerApi } from '../../api/customerApi';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { RatingStars } from '../../components/ui/RatingStars';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import {
  PLAN_TYPES,
  MEAL_PLANS,
  AVAILABILITY_STATUSES
} from '../../utils/constants';
import {
  formatCurrency,
  formatDistance,
  formatDate,
  formatTime
} from '../../utils/formatters';

export const ChefProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'catalog' | 'reviews'
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [planType, setPlanType] = useState('weekly');
  const [mealPlan, setMealPlan] = useState('lunch');

  // Fetch Chef Details & Menus
  const {
    data: chefResponse,
    isLoading: isChefLoading,
    isError: isChefError
  } = useQuery({
    queryKey: ['chefDetails', id],
    queryFn: () => discoveryApi.getChefById(id),
    staleTime: 60000
  });

  // Fetch Chef Reviews
  const {
    data: reviewsResponse,
    isLoading: isReviewsLoading
  } = useQuery({
    queryKey: ['chefReviews', id],
    queryFn: () => chefApi.getChefReviews(id),
    staleTime: 60000
  });

  // Fetch customer favorites
  const { data: favData } = useQuery({
    queryKey: ['favorites'],
    queryFn: customerApi.getFavorites,
    enabled: !!user
  });

  const favorites = favData?.data?.favorites || [];
  const isFav = favorites.some((f) => (typeof f === 'string' ? f === id : f._id === id));

  // Toggle favorite
  const toggleFavMutation = useMutation({
    mutationFn: () => {
      if (isFav) return customerApi.removeFavorite(id);
      return customerApi.addFavorite(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success(isFav ? 'Removed from favourites' : 'Added to favourites!');
    }
  });

  // Request subscription mutation
  const subscribeMutation = useMutation({
    mutationFn: (data) => subscriptionApi.createSubscription(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setSubModalOpen(false);
      toast.success('Subscription request submitted! Waiting for chef acceptance.');
      navigate('/subscriptions');
    },
    onError: (err) => {
      toast.error(err.message || 'Could not submit subscription request');
    }
  });

  const handleSubscribeSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to subscribe');
      navigate('/login');
      return;
    }
    if (!user.isEmailVerified) {
      toast.error('Please verify your email before requesting a subscription');
      return;
    }
    if (!user.isLocationVerified) {
      toast.error('Please verify your GPS location first');
      navigate('/onboarding');
      return;
    }

    subscribeMutation.mutate({
      chefId: id,
      planType,
      mealPlan
    });
  };

  if (isChefLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="card" className="h-48" />
        <Skeleton variant="text" count={3} />
      </div>
    );
  }

  if (isChefError || !chefResponse?.data?.chef) {
    return (
      <EmptyState
        title="Kitchen Not Available"
        description="This home kitchen could not be located or is not currently active."
        actionLabel="Back to Discovery"
        onAction={() => navigate('/discover')}
      />
    );
  }

  const { chef, meals = [], dailyMenus = [] } = chefResponse.data;
  const reviews = reviewsResponse?.data?.reviews || [];
  const statusInfo =
    AVAILABILITY_STATUSES[chef.chefProfile?.availabilityStatus] ||
    AVAILABILITY_STATUSES.accepting;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/discover"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Kitchens</span>
        </Link>
      </div>

      {/* Chef Profile Header Card */}
      <Card className="p-6 sm:p-8 border-cream-300 shadow-warm bg-white overflow-hidden relative">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-20 h-20 rounded-3xl bg-primary-100 border-2 border-primary-300 text-primary-800 flex items-center justify-center font-bold text-2xl uppercase shrink-0 shadow-sm overflow-hidden">
              {chef.photoUrl ? (
                <img src={chef.photoUrl} alt={chef.name} className="w-full h-full object-cover" />
              ) : (
                chef.name?.charAt(0) || 'K'
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
                  {chef.chefProfile?.kitchenName || `${chef.name}'s Kitchen`}
                </h1>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.bg}`}>
                  {statusInfo.label}
                </span>
              </div>

              <p className="text-sm text-neutral-600 font-medium">
                Home Kitchen run by <strong className="text-neutral-800">{chef.name}</strong>
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary-600" />
                  <span>{formatDistance(chef.distanceInMeters)} away • {chef.address}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-saffron-600" />
                  <span>{chef.chefProfile?.operatingHours || '07:30 - 21:30'}</span>
                </span>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-xs font-bold text-amber-800">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>{chef.ratingAverage ? Number(chef.ratingAverage).toFixed(1) : '5.0'}</span>
                  <span className="text-neutral-400 font-normal">({chef.ratingCount || 0})</span>
                </div>

                <div className="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs font-bold text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{chef.trustScore || 100}% Trust Score</span>
                </div>

                <div className="flex items-center gap-1 bg-cream-100 px-2.5 py-1 rounded-lg border border-cream-200 text-xs text-neutral-600">
                  <Users className="w-3.5 h-3.5 text-primary-600" />
                  <span>{chef.subscriberCount || 0} active subscribers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 self-stretch sm:self-auto">
            <Button
              variant="primary"
              size="lg"
              disabled={chef.chefProfile?.availabilityStatus === 'full' || chef.chefProfile?.availabilityStatus === 'paused'}
              onClick={() => setSubModalOpen(true)}
              className="shadow-sm font-bold"
            >
              <Sparkles className="w-4 h-4 mr-2 text-saffron-300" />
              <span>Request Subscription</span>
            </Button>

            <Button
              variant="outline"
              size="md"
              icon={Heart}
              onClick={() => toggleFavMutation.mutate()}
              className={isFav ? 'text-terracotta-600 border-terracotta-300 bg-terracotta-50/50' : ''}
            >
              <span>{isFav ? 'In Favourites' : 'Favourite'}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs navigation */}
      <div className="flex border-b border-cream-200">
        {[
          { id: 'menu', label: "Today's & Upcoming Menus", count: dailyMenus.length },
          { id: 'catalog', label: 'Dish Catalog', count: meals.length },
          { id: 'reviews', label: 'Subscriber Reviews', count: reviews.length }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-4 sm:px-6 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-800 bg-primary-50/40'
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

      {/* TAB 1: Today's & Upcoming Menus */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          {dailyMenus.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No Menus Scheduled Right Now"
              description="This chef hasn't published upcoming daily menus yet. Subscribe to be notified when the next fresh batch opens!"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dailyMenus.map((menu) => (
                <Card key={menu._id} className="p-5 border-cream-300 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="primary" size="sm" className="capitalize">
                        {menu.mealType}
                      </Badge>
                      <h4 className="font-serif font-bold text-base text-neutral-900 mt-1">
                        {formatDate(menu.menuDate, 'EEEE, dd MMMM')}
                      </h4>
                    </div>

                    <CountdownTimer cutoffTime={menu.cutoffTime} />
                  </div>

                  {/* Meals inside menu */}
                  <div className="space-y-2 pt-2 border-t border-cream-200">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                      Dishes on Menu:
                    </p>
                    {menu.meals?.map((dish) => (
                      <div
                        key={dish._id}
                        className="flex items-center justify-between text-xs p-2 rounded-xl bg-cream-50 border border-cream-200"
                      >
                        <div>
                          <p className="font-bold text-neutral-800">{dish.name}</p>
                          <p className="text-[11px] text-neutral-500 line-clamp-1">{dish.description}</p>
                        </div>
                        <span className="font-bold text-primary-800 text-sm">
                          {formatCurrency(dish.price)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-cream-200">
                    <span>
                      Pickup: <strong>{formatTime(menu.pickupStart)} – {formatTime(menu.pickupEnd)}</strong>
                    </span>
                    <span>
                      Slots Left: <strong>{menu.quantityAvailable}</strong>
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Dish Catalog */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meals.map((meal) => (
            <Card key={meal._id} className="p-4 border-cream-300 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Badge variant={meal.isVeg ? 'success' : 'neutral'} size="sm">
                    {meal.isJain ? 'Pure Jain' : meal.isVeg ? 'Pure Veg' : 'Non-Veg'}
                  </Badge>
                  <span className="font-serif font-bold text-primary-800 text-base">
                    {formatCurrency(meal.price)}
                  </span>
                </div>

                <h4 className="font-serif font-bold text-neutral-900 text-sm">
                  {meal.name}
                </h4>

                <p className="text-xs text-neutral-500 line-clamp-2 mt-1">
                  {meal.description || 'Delicious home-prepared regional specialty.'}
                </p>
              </div>

              <div className="pt-2 border-t border-cream-200 flex items-center justify-between text-[11px] text-neutral-400 capitalize">
                <span>Category: {meal.category?.replace('_', ' ')}</span>
                <span>Type: {meal.mealType}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 3: Reviews */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {isReviewsLoading ? (
            <Skeleton variant="card" count={3} />
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No Reviews Yet"
              description="Be one of the first neighbours to subscribe and leave an authentic review for this home kitchen."
            />
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <Card key={rev._id} className="p-4 sm:p-5 border-cream-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-cream-200 text-neutral-700 flex items-center justify-center font-bold text-xs uppercase">
                        {rev.author?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-neutral-900">{rev.author?.name || 'Neighbour'}</p>
                        <p className="text-[10px] text-neutral-400">{formatDate(rev.createdAt)}</p>
                      </div>
                    </div>

                    <RatingStars value={rev.ratings?.overall || 5} />
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-neutral-700 leading-relaxed pt-1">
                      "{rev.comment}"
                    </p>
                  )}

                  {rev.ratings && (
                    <div className="flex flex-wrap gap-3 pt-2 border-t border-cream-200 text-[10px] text-neutral-500 font-medium">
                      <span>Food Quality: {rev.ratings.foodQuality || 5}/5</span>
                      <span>Quantity: {rev.ratings.foodQuantity || 5}/5</span>
                      <span>Hygiene: {rev.ratings.hygiene || 5}/5</span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Request Subscription Modal */}
      <Modal
        isOpen={subModalOpen}
        onClose={() => setSubModalOpen(false)}
        title={`Subscribe to ${chef.chefProfile?.kitchenName || chef.name}`}
        description="Choose your plan duration and meal times. Direct offline payment after acceptance."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubscribeSubmit} className="space-y-4">
          <Select
            label="Plan Duration"
            value={planType}
            onChange={(e) => setPlanType(e.target.value)}
            options={PLAN_TYPES}
            required
          />

          <Select
            label="Meal Coverage"
            value={mealPlan}
            onChange={(e) => setMealPlan(e.target.value)}
            options={MEAL_PLANS}
            required
          />

          {/* Offline Payment Explanation Alert */}
          <div className="p-3.5 bg-saffron-50 border border-saffron-300 rounded-xl text-saffron-900 text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-saffron-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">100% Direct Peer-to-Peer Food</p>
              <p className="text-neutral-600 text-[11px] leading-relaxed">
                ChiefNet has no online payment gateway. Once the chef accepts your request, direct chat and phone number are unlocked so you can settle payments offline (Cash/UPI) directly with the chef.
              </p>
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-3.5 bg-cream-100 rounded-xl border border-cream-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-neutral-500">Selected Plan:</span>
              <span className="font-bold capitalize text-neutral-800">{planType} Plan</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Meal Plan:</span>
              <span className="font-bold capitalize text-neutral-800">{mealPlan?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Pickup Location:</span>
              <span className="font-bold text-neutral-800">{chef.address}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSubModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={subscribeMutation.isPending}
            >
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

