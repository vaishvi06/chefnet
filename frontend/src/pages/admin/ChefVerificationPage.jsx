import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Ban,
  MapPin,
  Clock,
  ChefHat,
  Eye,
  AlertTriangle,
  KeyRound,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Drawer } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
import { MapPicker } from '../../components/shared/MapPicker';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Pagination } from '../../components/ui/Pagination';
import { formatDate } from '../../utils/formatters';

const STATUS_TABS = [
  { id: 'pending', label: 'Pending Review' },
  { id: 'approved', label: 'Approved & Live' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All Kitchens' }
];

export const ChefVerificationPage = () => {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [drawerChef, setDrawerChef] = useState(null);
  const [rejectingChef, setRejectingChef] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['pendingChefs', page, selectedStatus],
    queryFn: () =>
      adminApi.getPendingChefs({
        page,
        limit: 10,
        status: selectedStatus === 'all' ? undefined : selectedStatus
      })
  });

  const chefs = data?.data?.chefs || [];
  const pagination = data?.data?.pagination || { page: 1, pages: 1, total: 0 };

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: (id) => adminApi.approveChef(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingChefs'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
      setDrawerChef(null);
      toast.success('Kitchen approved! Chef is now live.');
    },
    onError: (err) => toast.error(err.message || 'Failed to approve kitchen')
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => adminApi.rejectChef(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingChefs'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
      setRejectingChef(null);
      setRejectReason('');
      setDrawerChef(null);
      toast.success('Kitchen application rejected with explanation.');
    },
    onError: (err) => toast.error(err.message || 'Failed to reject kitchen')
  });

  // Suspend Mutation
  const suspendMutation = useMutation({
    mutationFn: ({ id, isSuspended }) => adminApi.toggleSuspendChef(id, { isSuspended }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingChefs'] });
      queryClient.invalidateQueries({ queryKey: ['adminAnalytics'] });
      setDrawerChef(null);
      toast.success('Chef account status updated.');
    },
    onError: (err) => toast.error(err.message || 'Failed to update chef status')
  });

  const getStatusBadge = (status, isSuspended) => {
    if (isSuspended) {
      return <Badge variant="danger" size="sm">Suspended</Badge>;
    }
    switch (status) {
      case 'approved':
        return <Badge variant="success" size="sm">Approved & Live</Badge>;
      case 'rejected':
        return <Badge variant="danger" size="sm">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge variant="warning" size="sm">Verification Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
          Household Kitchen Verifications
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Review home kitchen applications, operating capacity, and 1 km geofences before making them live.
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex border-b border-cream-200 gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setSelectedStatus(tab.id);
              setPage(1);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-colors whitespace-nowrap ${
              selectedStatus === tab.id
                ? 'bg-primary-50 text-primary-900 border-b-2 border-primary-800'
                : 'text-neutral-500 hover:text-neutral-800 hover:bg-cream-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton variant="card" count={3} />
      ) : chefs.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={`No ${selectedStatus !== 'all' ? selectedStatus : ''} Kitchens Found`}
          description={
            selectedStatus === 'pending'
              ? 'All submitted home kitchens have been processed. New kitchen registrations will appear here.'
              : 'No kitchens match this filter status.'
          }
        />
      ) : (
        <div className="space-y-4">
          {chefs.map((chef) => {
            const status = chef.chefProfile?.verificationStatus || 'pending';
            return (
              <Card key={chef._id} className="p-5 border-cream-300 space-y-3 shadow-warm">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-saffron-100 text-saffron-800 flex items-center justify-center font-bold text-base shrink-0">
                      <ChefHat className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif font-bold text-base text-neutral-900">
                          {chef.chefProfile?.kitchenName || `${chef.name}'s Kitchen`}
                        </h3>
                        {getStatusBadge(status, chef.isSuspended)}
                        {chef.chefProfile?.kitchenCode && (
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-cream-200 text-neutral-800">
                            {chef.chefProfile.kitchenCode}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-neutral-600 mt-0.5">
                        Chef: <strong>{chef.name}</strong> • {chef.email} • {chef.phone || 'No phone'}
                      </p>

                      <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary-600 shrink-0" />
                        <span>{chef.address || 'Address unverified'}</span>
                      </p>

                      {chef.chefProfile?.description && (
                        <p className="text-xs text-neutral-500 mt-1 italic line-clamp-1">
                          "{chef.chefProfile.description}"
                        </p>
                      )}

                      {status === 'rejected' && chef.chefProfile?.rejectionReason && (
                        <p className="text-xs text-rose-700 bg-rose-50 px-2 py-1 rounded mt-1.5">
                          Rejection Reason: {chef.chefProfile.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    icon={Eye}
                    onClick={() => setDrawerChef(chef)}
                  >
                    Review Application
                  </Button>
                </div>

                <div className="pt-2 border-t border-cream-200 flex flex-wrap items-center justify-between text-xs text-neutral-600">
                  <span>Hours: <strong>{chef.chefProfile?.operatingHours || '07:00 - 21:00'}</strong></span>
                  <span>Daily Capacity: <strong>{chef.chefProfile?.dailyCapacity || 20} meals</strong></span>
                  <span>Max Subs: <strong>{chef.chefProfile?.maxSubscribers || 15} foodies</strong></span>
                  <span>Area: <strong>{chef.area?.name || 'Unassigned Locality'}</strong></span>
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

      {/* Detail Drawer */}
      {drawerChef && (
        <Drawer
          isOpen={!!drawerChef}
          onClose={() => setDrawerChef(null)}
          title={drawerChef.chefProfile?.kitchenName || drawerChef.name}
          subtitle={`Home Chef Application • Registered ${formatDate(drawerChef.createdAt)}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-6">
            {/* Status overview */}
            <div className="flex items-center justify-between p-3 bg-cream-50 rounded-xl border border-cream-200">
              <span className="text-xs font-semibold text-neutral-700">Verification Status:</span>
              <div className="flex items-center gap-2">
                {getStatusBadge(drawerChef.chefProfile?.verificationStatus, drawerChef.isSuspended)}
                {drawerChef.chefProfile?.kitchenCode && (
                  <span className="font-mono text-xs font-bold text-primary-900 bg-primary-100 px-2 py-0.5 rounded">
                    Code: {drawerChef.chefProfile.kitchenCode}
                  </span>
                )}
              </div>
            </div>

            {/* Chef Identity */}
            <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Applicant:</span>
                <span className="font-bold text-neutral-900">{drawerChef.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Email:</span>
                <span className="text-neutral-900">{drawerChef.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Phone:</span>
                <span className="text-neutral-900">{drawerChef.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Kitchen Address:</span>
                <span className="font-semibold text-neutral-900 text-right max-w-xs">{drawerChef.address}</span>
              </div>
              {drawerChef.area?.name && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Operating Area:</span>
                  <span className="font-bold text-primary-800">{drawerChef.area.name}</span>
                </div>
              )}
            </div>

            {/* Kitchen Description */}
            <div className="p-3 bg-white rounded-xl border border-cream-200 text-xs">
              <span className="text-neutral-500 block text-[10px] uppercase font-bold mb-1">
                Kitchen Description & Specialties
              </span>
              <p className="text-neutral-700">
                {drawerChef.chefProfile?.description || 'No kitchen description provided.'}
              </p>
            </div>

            {/* Kitchen Specifications */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-xl border border-cream-200">
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Daily Capacity</span>
                <span className="text-base font-bold text-neutral-900">{drawerChef.chefProfile?.dailyCapacity || 20} meals</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-cream-200">
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Max Subscribers</span>
                <span className="text-base font-bold text-neutral-900">{drawerChef.chefProfile?.maxSubscribers || 15} foodies</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-cream-200">
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Operating Hours</span>
                <span className="text-xs font-bold text-neutral-900">{drawerChef.chefProfile?.operatingHours || '07:00 - 21:00'}</span>
              </div>
            </div>

            {/* Rejection Note if Rejected */}
            {drawerChef.chefProfile?.rejectionReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                <div className="flex items-center gap-1 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Rejection Reason on Record:</span>
                </div>
                <p>{drawerChef.chefProfile.rejectionReason}</p>
              </div>
            )}

            {/* Geofence Map Location */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                Pickup Map Location (1 km Radius)
              </h4>
              <MapPicker
                initialCoordinates={drawerChef.location?.coordinates}
                showRadius={true}
                readOnly={true}
                height="220px"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-cream-200 flex flex-col gap-2">
              {drawerChef.chefProfile?.verificationStatus !== 'approved' && (
                <Button
                  variant="primary"
                  fullWidth
                  size="md"
                  icon={CheckCircle2}
                  loading={approveMutation.isPending}
                  onClick={() => approveMutation.mutate(drawerChef._id)}
                >
                  Approve Kitchen & Make Live
                </Button>
              )}

              <div className="grid grid-cols-2 gap-2">
                {drawerChef.chefProfile?.verificationStatus !== 'rejected' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-terracotta-700 border-terracotta-200 hover:bg-terracotta-50"
                    icon={XCircle}
                    onClick={() => {
                      setRejectingChef(drawerChef);
                      setRejectReason('');
                    }}
                  >
                    Reject Application
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-terracotta-800 hover:bg-terracotta-100"
                  icon={Ban}
                  loading={suspendMutation.isPending}
                  onClick={() =>
                    suspendMutation.mutate({
                      id: drawerChef._id,
                      isSuspended: !drawerChef.isSuspended
                    })
                  }
                >
                  {drawerChef.isSuspended ? 'Reinstate Account' : 'Suspend Account'}
                </Button>
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* Reject Modal */}
      {rejectingChef && (
        <Modal
          isOpen={!!rejectingChef}
          onClose={() => setRejectingChef(null)}
          title={`Reject Application: ${rejectingChef.chefProfile?.kitchenName || rejectingChef.name}`}
          description="Provide a clear explanation for rejecting this home kitchen application. The chef will receive this feedback."
          maxWidth="max-w-md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (rejectReason.trim().length < 5) {
                toast.error('Please enter a rejection explanation (minimum 5 characters)');
                return;
              }
              rejectMutation.mutate({
                id: rejectingChef._id,
                reason: rejectReason.trim()
              });
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g., Incomplete hygiene registration, kitchen location outside active municipal boundaries..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-xl border border-cream-300 p-2.5 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <p className="text-[10px] text-neutral-400 mt-1">Minimum 5 characters required.</p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRejectingChef(null)}
                disabled={rejectMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="md"
                loading={rejectMutation.isPending}
                disabled={rejectReason.trim().length < 5}
              >
                Confirm Rejection
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
