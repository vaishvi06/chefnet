import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Compass,
  Map,
  List,
  Heart,
  SlidersHorizontal,
  Star,
  MapPin,
  Utensils,
  Leaf,
  Users,
  Navigation
} from 'lucide-react';
import toast from 'react-hot-toast';
import { discoveryApi } from '../../api/discoveryApi';
import { customerApi } from '../../api/customerApi';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Pagination } from '../../components/ui/Pagination';
import { MapPicker } from '../../components/shared/MapPicker';
import { Modal } from '../../components/ui/Modal';
import { AreaStatusBanner } from '../../components/shared/AreaStatusBanner';
import {
  MEAL_CATEGORIES,
  AVAILABILITY_STATUSES,
  DEFAULT_COORDINATES
} from '../../utils/constants';
import { formatDistance, formatCurrency } from '../../utils/formatters';

export const DiscoverPage = () => {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  // Selected Coordinates for browsing (stored in local state / localStorage for guests)
  const [selectedCoords, setSelectedCoords] = useState(() => {
    if (user?.location?.coordinates?.length === 2 && (user.location.coordinates[0] !== 0 || user.location.coordinates[1] !== 0)) {
      return user.location.coordinates;
    }
    const saved = localStorage.getItem('chiefnet_guest_coords');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 2) return parsed;
      } catch (e) {}
    }
    return DEFAULT_COORDINATES;
  });

  const [selectedAddress, setSelectedAddress] = useState(() => {
    return user?.address || localStorage.getItem('chiefnet_guest_address') || 'Bellandur Green Glen Layout, Bengaluru';
  });

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [tempCoords, setTempCoords] = useState(selectedCoords);
  const [tempAddress, setTempAddress] = useState(selectedAddress);
  const [locationSource, setLocationSource] = useState('pin');

  // Filters & State
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [hoveredChefId, setHoveredChefId] = useState(null);
  const [category, setCategory] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [jainOnly, setJainOnly] = useState(false);
  const [minRating, setMinRating] = useState('');
  const [availability, setAvailability] = useState('');
  const [sortBy, setSortBy] = useState('distance');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Sync coords when user profile changes
  useEffect(() => {
    if (user?.location?.coordinates?.length === 2 && (user.location.coordinates[0] !== 0 || user.location.coordinates[1] !== 0)) {
      setSelectedCoords(user.location.coordinates);
      if (user.address) setSelectedAddress(user.address);
    }
  }, [user]);

  // Query discovered chefs
  const {
    data: discoveryData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: [
      'discoveredChefs',
      { category, vegOnly, jainOnly, minRating, availability, sortBy, page, selectedCoords }
    ],
    queryFn: () =>
      discoveryApi.discoverChefs({
        category: category || undefined,
        vegOnly: vegOnly ? true : undefined,
        jainOnly: jainOnly ? true : undefined,
        minRating: minRating || undefined,
        availability: availability || undefined,
        sortBy,
        page,
        limit: 9,
        lng: selectedCoords[0],
        lat: selectedCoords[1]
      }),
    staleTime: 30000
  });

  // Query customer favorites
  const { data: favData } = useQuery({
    queryKey: ['favorites'],
    queryFn: customerApi.getFavorites,
    enabled: !!user
  });

  const favorites = favData?.data?.favorites || [];
  const favoriteIds = new Set(favorites.map((f) => (typeof f === 'string' ? f : f._id)));

  // Add/remove favorite mutations
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ chefId, isFav }) => {
      if (isFav) {
        return customerApi.removeFavorite(chefId);
      } else {
        return customerApi.addFavorite(chefId);
      }
    },
    onSuccess: (_, { isFav }) => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast.success(isFav ? 'Removed from favourites' : 'Added to favourites!');
    },
    onError: () => toast.error('Failed to update favourite')
  });

  const chefs = discoveryData?.data?.chefs || [];
  const pagination = discoveryData?.data?.pagination || { page: 1, pages: 1, total: 0 };
  const areaActive = discoveryData?.data?.areaActive !== false;
  const areaInfo = discoveryData?.data?.area;

  const handleSaveLocation = async () => {
    setSelectedCoords(tempCoords);
    if (tempAddress) setSelectedAddress(tempAddress);

    // Save for guest browsing
    localStorage.setItem('chiefnet_guest_coords', JSON.stringify(tempCoords));
    if (tempAddress) localStorage.setItem('chiefnet_guest_address', tempAddress);

    // If logged in, update in database
    if (user) {
      try {
        await userApi.updateLocation({
          coordinates: tempCoords,
          address: tempAddress,
          locationSource
        });
        await refreshUser();
      } catch (e) {}
    }

    setLocationModalOpen(false);
    toast.success('Browsing location updated. Refreshing nearby home kitchens!');
  };

  return (
    <div className="space-y-6">
      {/* Location Bar & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
              Kitchens Within 1 km
            </h1>
            <Badge variant="primary" size="sm">
              Hyperlocal
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Fresh homemade meals prepared by verified home cooks within walking distance.
          </p>
        </div>

        {/* Change location control */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setTempCoords(selectedCoords);
              setTempAddress(selectedAddress);
              setLocationModalOpen(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-cream-300 bg-white shadow-2xs hover:bg-cream-100 text-xs font-medium text-neutral-700 transition"
          >
            <Navigation className="w-3.5 h-3.5 text-primary-600 shrink-0" />
            <span className="truncate max-w-[200px] text-left">
              {selectedAddress ? selectedAddress.split(',')[0] : `${selectedCoords[1].toFixed(3)}, ${selectedCoords[0].toFixed(3)}`}
            </span>
            <span className="text-primary-700 font-bold underline ml-1">Change</span>
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            icon={SlidersHorizontal}
            className={showFilters ? 'bg-cream-200 border-neutral-400' : ''}
          >
            Filters
          </Button>

          {/* View mode toggle */}
          <div className="inline-flex rounded-xl bg-cream-200 p-1 border border-cream-300">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-primary-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'map'
                  ? 'bg-white text-primary-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Map className="w-4 h-4" />
              <span className="hidden sm:inline">Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter drawer */}
      {showFilters && (
        <Card className="p-4 sm:p-5 bg-cream-50 border-cream-300 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Select
              label="Cuisine / Category"
              placeholder="All Cuisines"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              options={MEAL_CATEGORIES}
            />

            <Select
              label="Minimum Rating"
              placeholder="Any Rating"
              value={minRating}
              onChange={(e) => {
                setMinRating(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '4.8', label: '⭐ 4.8 & above' },
                { value: '4.5', label: '⭐ 4.5 & above' },
                { value: '4.0', label: '⭐ 4.0 & above' }
              ]}
            />

            <Select
              label="Availability"
              placeholder="All Kitchens"
              value={availability}
              onChange={(e) => {
                setAvailability(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'accepting', label: 'Accepting Subscriptions' },
                { value: 'limited', label: 'Limited Slots' }
              ]}
            />

            <Select
              label="Sort By"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'distance', label: 'Nearest Distance (< 1 km)' },
                { value: 'rating', label: 'Highest Rated' }
              ]}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-cream-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
                <input
                  type="checkbox"
                  checked={vegOnly}
                  onChange={(e) => {
                    setVegOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                />
                <span className="flex items-center gap-1">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" /> Pure Veg Only
                </span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
                <input
                  type="checkbox"
                  checked={jainOnly}
                  onChange={(e) => {
                    setJainOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                />
                <span className="flex items-center gap-1">🌿 Jain Friendly</span>
              </label>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCategory('');
                setVegOnly(false);
                setJainOnly(false);
                setMinRating('');
                setAvailability('');
                setSortBy('distance');
                setPage(1);
              }}
            >
              Reset Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Area Status Banner if waiting list */}
      {!isLoading && !areaActive && (
        <div className="py-2">
          <AreaStatusBanner area={areaInfo} />
        </div>
      )}

      {/* Map View */}
      {viewMode === 'map' && (
        <div className="space-y-4">
          <MapPicker
            initialCoordinates={selectedCoords}
            chefs={chefs}
            hoveredChefId={hoveredChefId}
            onChefSelect={(c) => setHoveredChefId(c._id)}
            showRadius={true}
            showSearch={false}
            readOnly={true}
            height="460px"
          />
          <p className="text-xs text-center text-neutral-500">
            Dashed green circle shows the 1 km boundary from your selected location. Click any kitchen pin to highlight it.
          </p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 bg-white rounded-2xl border border-cream-200 space-y-3">
              <Skeleton variant="thumbnail" className="w-full h-40 rounded-xl" />
              <Skeleton variant="title" />
              <Skeleton variant="text" count={2} />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <Card className="p-8 text-center bg-terracotta-50/50 border-terracotta-200">
          <p className="text-sm text-terracotta-700 font-medium">
            {error?.message || 'Failed to discover nearby chefs. Please adjust your location.'}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
            Retry Search
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && chefs.length === 0 && (
        <EmptyState
          icon={Compass}
          title="No Kitchens Found Nearby"
          description="We couldn't find any approved home chefs matching your filters within 1 km. Try changing your search location or clearing filters."
          actionLabel="Clear Filters"
          onAction={() => {
            setCategory('');
            setVegOnly(false);
            setJainOnly(false);
            setMinRating('');
            setAvailability('');
          }}
        />
      )}

      {/* Chef List Cards with Mutual Hover Sync */}
      {!isLoading && !isError && chefs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chefs.map((chef) => {
            const isFav = favoriteIds.has(chef._id);
            const statusInfo =
              AVAILABILITY_STATUSES[chef.chefProfile?.availabilityStatus] ||
              AVAILABILITY_STATUSES.accepting;
            const isHighlighted = hoveredChefId === chef._id;

            return (
              <Card
                key={chef._id}
                hover
                onMouseEnter={() => setHoveredChefId(chef._id)}
                onMouseLeave={() => setHoveredChefId(null)}
                className={`overflow-hidden flex flex-col justify-between border-cream-300 p-0 transition-all duration-200 ${
                  isHighlighted ? 'ring-2 ring-primary-600 shadow-md transform -translate-y-1' : ''
                }`}
              >
                <div>
                  {/* Image / Header Placeholder */}
                  <div className="relative h-44 bg-gradient-to-tr from-primary-900 to-primary-700 p-4 flex flex-col justify-between text-white overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

                    {/* Top Row: Availability Badge & Favourite Button */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-2xs backdrop-blur-md ${statusInfo.bg}`}>
                        {statusInfo.label}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavoriteMutation.mutate({ chefId: chef._id, isFav });
                        }}
                        aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                        className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-terracotta-600 transition-all"
                      >
                        <Heart className={`w-4 h-4 ${isFav ? 'fill-terracotta-500 text-terracotta-500' : ''}`} />
                      </button>
                    </div>

                    {/* Bottom Row: Distance Pill */}
                    <div className="relative z-10 flex items-center gap-1.5 self-start bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-saffron-400" />
                      <span>{formatDistance(chef.distanceInMeters)} away (self-pickup)</span>
                    </div>
                  </div>

                  {/* Kitchen Details */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-neutral-900 line-clamp-1">
                        {chef.chefProfile?.kitchenName || `${chef.name}'s Kitchen`}
                      </h3>
                      <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                        <span>by {chef.name}</span>
                        <span>•</span>
                        <span>{chef.chefProfile?.operatingHours || '07:30 - 21:30'}</span>
                      </p>
                    </div>

                    {/* Ratings & Trust Score */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-cream-200">
                      <div className="flex items-center gap-1 font-semibold text-neutral-800">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>{chef.ratingAverage ? Number(chef.ratingAverage).toFixed(1) : '5.0'}</span>
                        <span className="text-neutral-400 font-normal">
                          ({chef.ratingCount || 0} reviews)
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                        <Users className="w-3.5 h-3.5 text-primary-600" />
                        <span>{chef.subscriberCount || 0} active subscribers</span>
                      </div>
                    </div>

                    {/* Available sample dishes */}
                    {chef.availableMeals && chef.availableMeals.length > 0 && (
                      <div className="pt-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                          Featured Home Meals:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {chef.availableMeals.slice(0, 3).map((m, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] px-2 py-0.5 rounded-lg bg-cream-100 text-neutral-700 border border-cream-200 truncate max-w-[150px]"
                            >
                              {m.name} ({formatCurrency(m.price)})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 bg-cream-50 border-t border-cream-200">
                  <Link to={`/customer/chefs/${chef._id}`}>
                    <Button variant="primary" fullWidth size="sm">
                      <span>View Kitchen & Menu</span>
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && pagination.pages > 1 && (
        <Pagination
          page={page}
          pages={pagination.pages}
          total={pagination.total}
          onPageChange={(newPage) => setPage(newPage)}
        />
      )}

      {/* Location Changer Modal */}
      <Modal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        title="Change 1 km Discovery Location"
        description="Choose where you want to discover home kitchens: search an area name, use device GPS, or tap anywhere on the map."
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <MapPicker
            initialCoordinates={tempCoords}
            onCoordinatesChange={(c, src) => {
              setTempCoords(c);
              if (src) setLocationSource(src);
            }}
            onAddressSelected={(addr) => {
              setTempAddress(addr);
            }}
            showRadius={true}
            showSearch={true}
            height="320px"
          />

          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={() => setLocationModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleSaveLocation}>
              Discover Near This Pin
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
