import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Calendar, CheckCircle2, AlertOctagon, XCircle } from 'lucide-react';
import { customerApi } from '../../api/customerApi';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Pagination } from '../../components/ui/Pagination';
import { formatDate, formatCurrency, formatTime } from '../../utils/formatters';

export const CustomerHistoryPage = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['customerHistory', page],
    queryFn: () => customerApi.getHistory({ page, limit: 10 }),
    staleTime: 30000
  });

  const reservations = data?.data?.reservations || [];
  const subscriptions = data?.data?.subscriptions || [];
  const pagination = data?.data?.pagination || { page: 1, pages: 1, total: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
          Order & Pickup History
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Complete log of past subscriptions, collected meals, and missed pickups.
        </p>
      </div>

      {isLoading ? (
        <Skeleton variant="card" count={3} />
      ) : reservations.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Past History Yet"
          description="Your completed and historical reservations will appear here once you collect your meals."
        />
      ) : (
        <div className="space-y-4">
          {reservations.map((res) => {
            const isPickedUp = res.status === 'picked_up';
            const isMissed = res.status === 'missed' || res.isMissed;
            const isCancelled = res.status === 'cancelled';

            return (
              <Card key={res._id} className="p-5 border-cream-300 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif font-bold text-base text-neutral-900">
                        {res.meal?.name || 'Home Meal'}
                      </h3>
                      <Badge
                        variant={isPickedUp ? 'success' : isMissed ? 'danger' : 'neutral'}
                        size="sm"
                        dot
                      >
                        {isPickedUp ? 'Picked Up' : isMissed ? 'Missed Pickup' : isCancelled ? 'Cancelled' : res.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-neutral-500 mt-0.5">
                      Chef: <strong className="text-neutral-700">{res.chef?.name}</strong> •{' '}
                      {res.chef?.chefProfile?.kitchenName || 'Kitchen'}
                    </p>
                  </div>

                  <span className="font-serif font-bold text-primary-800 text-base">
                    {formatCurrency(res.price)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 pt-2 border-t border-cream-200">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary-600" />
                    Reservation: {formatDate(res.reserveDate, 'EEE, dd MMM yyyy')}
                  </span>

                  {res.pickedUpAt && (
                    <span className="flex items-center gap-1 text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Collected: {formatDate(res.pickedUpAt, 'dd MMM, hh:mm a')}
                    </span>
                  )}

                  {isMissed && (
                    <span className="flex items-center gap-1 text-terracotta-700 font-semibold">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      Missed Pickup Window (Impacts Trust Score)
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && pagination.pages > 1 && (
        <Pagination
          page={page}
          pages={pagination.pages}
          total={pagination.total}
          onPageChange={(p) => setPage(p)}
        />
      )}
    </div>
  );
};

