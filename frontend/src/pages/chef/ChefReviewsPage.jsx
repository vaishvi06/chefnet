import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, ShieldCheck, ThumbsUp, MessageSquare } from 'lucide-react';
import { chefApi } from '../../api/chefApi';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { RatingStars } from '../../components/ui/RatingStars';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/formatters';

export const ChefReviewsPage = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['chefReviews', user?._id],
    queryFn: () => chefApi.getChefReviews(user?._id, { limit: 50 }),
    enabled: !!user?._id
  });

  const reviews = data?.data?.reviews || [];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
          Subscriber Reviews & Ratings
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Feedback submitted by neighbourhood subscribers after self-pickup.
        </p>
      </div>

      {/* Aggregate Score Card */}
      <Card className="p-6 border-cream-300 bg-cream-50 flex flex-col sm:flex-row items-center justify-around gap-6 text-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Overall Kitchen Rating
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl font-serif font-bold text-neutral-900">
              {user?.ratingAverage ? Number(user.ratingAverage).toFixed(1) : '5.0'}
            </span>
            <div className="text-left">
              <RatingStars value={user?.ratingAverage || 5} size="md" />
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Based on {user?.ratingCount || 0} reviews
              </p>
            </div>
          </div>
        </div>

        <div className="h-12 w-px bg-cream-200 hidden sm:block" />

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Reliability & Trust Score
          </span>
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
            <span className="text-4xl font-serif font-bold text-emerald-800">
              {user?.trustScore ?? 100}%
            </span>
          </div>
        </div>
      </Card>

      {/* Reviews List */}
      {isLoading ? (
        <Skeleton variant="card" count={3} />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No Reviews Received Yet"
          description="As soon as subscribers pick up meals from your kitchen and leave feedback, their ratings will appear here."
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <Card key={rev._id} className="p-5 border-cream-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cream-200 text-neutral-700 font-bold flex items-center justify-center text-sm uppercase">
                    {rev.author?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-neutral-900">
                      {rev.author?.name || 'Neighbour Subscriber'}
                    </h4>
                    <p className="text-[10px] text-neutral-400">
                      {formatDate(rev.createdAt, 'dd MMM yyyy')}
                    </p>
                  </div>
                </div>

                <RatingStars value={rev.ratings?.overall || 5} size="md" />
              </div>

              {rev.comment && (
                <p className="text-xs text-neutral-700 leading-relaxed bg-cream-50 p-3 rounded-xl border border-cream-200">
                  "{rev.comment}"
                </p>
              )}

              {rev.ratings && (
                <div className="flex flex-wrap gap-4 pt-2 border-t border-cream-200 text-xs text-neutral-500 font-medium">
                  <span>Food Quality: <strong className="text-neutral-800">{rev.ratings.foodQuality || 5}/5</strong></span>
                  <span>Quantity: <strong className="text-neutral-800">{rev.ratings.foodQuantity || 5}/5</strong></span>
                  <span>Hygiene: <strong className="text-neutral-800">{rev.ratings.hygiene || 5}/5</strong></span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

