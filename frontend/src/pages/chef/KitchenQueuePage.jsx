import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UtensilsCrossed,
  Clock,
  CheckCircle,
  PackageCheck,
  ChevronRight,
  Filter,
  Calendar,
  AlertCircle,
  ScanLine,
  KeyRound,
  Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { chefApi } from '../../api/chefApi';
import { reservationApi } from '../../api/reservationApi';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate, formatTime } from '../../utils/formatters';

const COLUMNS = [
  { id: 'reserved', title: '1. Reserved', desc: 'Awaiting cooking start', color: 'border-blue-400 bg-blue-50/30' },
  { id: 'preparing', title: '2. Preparing', desc: 'Simmering & packaging', color: 'border-amber-400 bg-amber-50/30' },
  { id: 'ready', title: '3. Ready for Pickup', desc: 'Awaiting customer pass', color: 'border-emerald-400 bg-emerald-50/30' },
  { id: 'picked_up', title: '4. Picked Up', desc: 'Completed today', color: 'border-neutral-300 bg-neutral-50/50' }
];

export const KitchenQueuePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealTypeFilter, setMealTypeFilter] = useState('all');

  // Quick verify modal
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [inputToken, setInputToken] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['chefQueue', selectedDate, mealTypeFilter],
    queryFn: () => chefApi.getKitchenQueue({ date: selectedDate, mealType: mealTypeFilter }),
    refetchInterval: 8000 // auto refresh queue
  });

  const reservations = data?.data?.reservations || [];
  const counts = data?.data?.counts || {
    total: 0,
    pending: 0,
    ready: 0,
    picked_up: 0,
    missed: 0
  };

  // Status advance mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => reservationApi.updateReservationStatus(id, status),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['chefQueue'] });
      toast.success(res.message || 'Progress updated');
    },
    onError: (err) => toast.error(err.message || 'Failed to advance status')
  });

  // Verify mutation
  const verifyMutation = useMutation({
    mutationFn: (token) => reservationApi.verifyReservation(token),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['chefQueue'] });
      setVerifyModalOpen(false);
      setInputToken('');
      toast.success(res.message || 'Pickup verified successfully!');
    },
    onError: (err) => toast.error(err.message || 'Token verification failed')
  });

  const getNextAction = (status) => {
    if (status === 'reserved') return { next: 'preparing', label: 'Start Preparing' };
    if (status === 'preparing') return { next: 'ready', label: 'Mark Ready' };
    if (status === 'ready') return { next: 'picked_up', label: 'Hand Over (Picked Up)' };
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
              Kitchen Live Queue
            </h1>
            {user?.chefProfile?.kitchenCode && (
              <Badge variant="outline" className="font-mono text-xs bg-cream-50 border-primary-300 text-primary-800">
                Code: {user.chefProfile.kitchenCode}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Track daily subscriptions and verify customer pickup passes in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/chef/verify-qr">
            <Button variant="primary" size="sm" icon={ScanLine} className="shadow-xs">
              Scan Pass QR
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            icon={KeyRound}
            onClick={() => setVerifyModalOpen(true)}
            className="bg-white"
          >
            Enter Token
          </Button>

          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-36 text-xs py-1.5 bg-white"
          />

          <Select
            value={mealTypeFilter}
            onChange={(e) => setMealTypeFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Meals' },
              { value: 'breakfast', label: 'Breakfast' },
              { value: 'lunch', label: 'Lunch' },
              { value: 'dinner', label: 'Dinner' }
            ]}
            className="w-32 text-xs py-1.5 bg-white"
          />
        </div>
      </div>

      {/* Summary Counts Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-cream-300 rounded-xl flex items-center justify-between shadow-2xs">
          <span className="text-xs text-neutral-500 font-medium">Total Orders:</span>
          <span className="font-bold text-base text-neutral-900">{counts.total}</span>
        </div>
        <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between shadow-2xs">
          <span className="text-xs text-blue-700 font-medium">In Kitchen:</span>
          <span className="font-bold text-base text-blue-900">{counts.pending}</span>
        </div>
        <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between shadow-2xs">
          <span className="text-xs text-emerald-700 font-medium">Ready for Pickup:</span>
          <span className="font-bold text-base text-emerald-900">{counts.ready}</span>
        </div>
        <div className="p-3 bg-neutral-100/60 border border-neutral-300 rounded-xl flex items-center justify-between shadow-2xs">
          <span className="text-xs text-neutral-600 font-medium">Picked Up:</span>
          <span className="font-bold text-base text-neutral-900">{counts.picked_up}</span>
        </div>
      </div>

      {/* Kanban Order Columns */}
      {isLoading ? (
        <Skeleton variant="card" count={2} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colItems = reservations.filter((r) => r.status === col.id);

            return (
              <div
                key={col.id}
                className={`rounded-2xl border-2 ${col.color} p-4 flex flex-col min-h-[480px] shadow-2xs`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-cream-200 mb-3">
                  <div>
                    <h3 className="font-serif font-bold text-sm text-neutral-900">
                      {col.title}
                    </h3>
                    <p className="text-[10px] text-neutral-500">{col.desc}</p>
                  </div>
                  <span className="w-6 h-6 rounded-full bg-white border border-neutral-300 font-bold text-xs flex items-center justify-center text-neutral-700 shadow-2xs">
                    {colItems.length}
                  </span>
                </div>

                {/* Column Items */}
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {colItems.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-xs text-neutral-400 italic">
                      No meals here
                    </div>
                  ) : (
                    colItems.map((res) => {
                      const action = getNextAction(res.status);

                      return (
                        <Card
                          key={res._id}
                          className="p-3.5 bg-white border-cream-300 shadow-xs space-y-2.5"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge variant="primary" size="sm" className="capitalize text-[10px]">
                                {res.mealType}
                              </Badge>
                              <h4 className="font-serif font-bold text-xs text-neutral-900 mt-1 line-clamp-1">
                                {res.meal?.name || 'Meal'}
                              </h4>
                            </div>

                            {/* Token Badge */}
                            {res.manualToken && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(res.manualToken);
                                  toast.success('Token copied to clipboard');
                                }}
                                title="Click to copy manual token"
                                className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-cream-100 hover:bg-cream-200 border border-cream-300 text-neutral-700 font-semibold flex items-center gap-1"
                              >
                                <span>{res.manualToken}</span>
                                <Copy className="w-2.5 h-2.5 text-neutral-400" />
                              </button>
                            )}
                          </div>

                          <div className="text-[11px] text-neutral-600 space-y-0.5">
                            <p className="font-semibold text-neutral-800">
                              Subscriber: {res.customer?.name || 'Customer'}
                            </p>
                            <p className="text-neutral-500 truncate">
                              {res.customer?.phone || res.customer?.address}
                            </p>
                            {res.dailyMenu && (
                              <p className="text-[10px] text-neutral-400">
                                Pickup window: {res.dailyMenu.pickupStart} - {res.dailyMenu.pickupEnd}
                              </p>
                            )}
                          </div>

                          {/* Advance Button */}
                          {action && (
                            <div className="pt-2 border-t border-cream-100">
                              <Button
                                variant="primary"
                                size="sm"
                                fullWidth
                                className="text-xs py-1.5"
                                loading={updateStatusMutation.isPending}
                                onClick={() =>
                                  updateStatusMutation.mutate({
                                    id: res._id,
                                    status: action.next
                                  })
                                }
                              >
                                <span>{action.label}</span>
                                <ChevronRight className="w-3.5 h-3.5 ml-1" />
                              </Button>
                            </div>
                          )}
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Token Verification Modal */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title="Verify Pickup Pass Token"
        description="Enter the 4-digit code or complete token shown on the subscriber's phone screen."
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inputToken.trim()) {
              verifyMutation.mutate(inputToken.trim());
            }
          }}
          className="space-y-4"
        >
          <Input
            label="Pickup Pass Token"
            placeholder="e.g. CHF-1001-4412"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            required
            autoFocus
            helperText="The customer can read this token from their phone's QR pass screen."
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setVerifyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={verifyMutation.isPending}
              disabled={!inputToken.trim()}
            >
              Verify Pickup
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
