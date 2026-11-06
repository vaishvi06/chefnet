import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Star, MapPin, Trash2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { customerApi } from '../../api/customerApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';

export const CustomerFavoritesPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: customerApi.getFavorites
  });

  const favorites = data?.data?.favorites || [];

  const removeFavMutation = useMutation({
    mutationFn: (chefId) => customerApi.removeFavorite(chefId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['discoveredChefs'] });
      toast.success('Removed from favourites');
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
          Favourite Kitchens
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Quickly access your saved neighbourhood home chefs and daily menus.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Skeleton variant="card" count={3} />
        </div>
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No Favourites Saved Yet"
          description="Browse home kitchens in your 1 km radius and tap the heart icon to save your preferred cooks."
          actionLabel="Explore Kitchens"
          onAction={() => navigate('/customer/discover')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {favorites.map((chef) => {
            const isUnavailable =
              chef.isSuspended || chef.chefProfile?.verificationStatus !== 'approved';

            return (
              <Card
                key={chef._id}
                hover
                className="overflow-hidden p-0 border-cream-300 flex flex-col justify-between"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-base uppercase">
                      {chef.name?.charAt(0) || 'K'}
                    </div>

                    <div className="flex items-center gap-1">
                      {isUnavailable && (
                        <Badge variant="warning" size="sm">
                          Unavailable
                        </Badge>
                      )}
                      <button
                        onClick={() => removeFavMutation.mutate(chef._id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-terracotta-600 hover:bg-terracotta-50 transition-colors"
                        title="Remove from favourites"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-base text-neutral-900 line-clamp-1">
                      {chef.chefProfile?.kitchenName || `${chef.name}'s Kitchen`}
                    </h3>
                    <p className="text-xs text-neutral-500">by {chef.name}</p>
                  </div>

                  {isUnavailable && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>This kitchen is currently paused or pending administrative re-verification.</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-neutral-600">
                    <div className="flex items-center gap-1 font-bold text-neutral-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{chef.ratingAverage ? Number(chef.ratingAverage).toFixed(1) : '5.0'}</span>
                    </div>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary-600" />
                      <span className="truncate max-w-[130px]">{chef.address}</span>
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-cream-50 border-t border-cream-200">
                  <Link to={`/customer/chefs/${chef._id}`}>
                    <Button variant="primary" fullWidth size="sm" disabled={isUnavailable}>
                      <span>{isUnavailable ? 'Temporarily Unavailable' : 'View Kitchen & Menu'}</span>
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
