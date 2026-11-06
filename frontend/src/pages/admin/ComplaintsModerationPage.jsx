import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { Pagination } from '../../components/ui/Pagination';
import { formatDateTime } from '../../utils/formatters';
import { COMPLAINT_CATEGORIES } from '../../utils/constants';
import {
  AlertTriangle,
  Eye,
  CheckCircle,
  ShieldAlert,
  UserCheck,
  FileText,
  Filter,
  User,
  ChefHat
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ComplaintsModerationPage = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [reporterRoleFilter, setReporterRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  // Form states for resolution
  const [resolutionStatus, setResolutionStatus] = useState('resolved');
  const [adminAction, setAdminAction] = useState('none');
  const [adminNote, setAdminNote] = useState('');
  const [hideReview, setHideReview] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['adminComplaints', { statusFilter, categoryFilter, reporterRoleFilter, page }],
    queryFn: async () => {
      const res = await adminApi.getComplaints({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        reporterRole: reporterRoleFilter || undefined,
        page,
        limit: 10
      });
      return res.data?.data || {};
    }
  });

  const complaints = data?.complaints || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  const resolveMutation = useMutation({
    mutationFn: (payload) => adminApi.resolveComplaint(selectedComplaint._id, payload),
    onSuccess: () => {
      toast.success('Complaint resolution saved and administrative actions applied');
      queryClient.invalidateQueries({ queryKey: ['adminComplaints'] });
      setIsActionModalOpen(false);
      setSelectedComplaint(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update complaint');
    }
  });

  const handleOpenAction = (complaint) => {
    setSelectedComplaint(complaint);
    setResolutionStatus(complaint.status === 'open' ? 'under_review' : complaint.status);
    setAdminAction(complaint.action || 'none');
    setAdminNote(complaint.adminNote || '');
    setHideReview(false);
    setIsActionModalOpen(true);
  };

  const handleSaveResolution = (e) => {
    e.preventDefault();
    if (!adminNote.trim()) {
      toast.error('Please enter an administrative note for this decision');
      return;
    }
    resolveMutation.mutate({
      status: resolutionStatus,
      adminNote: adminNote.trim(),
      action: adminAction,
      hideReview
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <Badge variant="terracotta">Open</Badge>;
      case 'under_review':
        return <Badge variant="saffron">Under Review</Badge>;
      case 'resolved':
        return <Badge variant="primary">Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="neutral">Dismissed</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getReporterBadge = (role) => {
    if (role === 'chef') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-saffron-100 text-saffron-900 border border-saffron-300">
          <ChefHat className="w-3 h-3" /> Chef vs Customer
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
        <User className="w-3 h-3" /> Customer vs Chef
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
            Complaints & Moderation
          </h1>
          <p className="text-sm text-gray-600">
            Investigate customer and chef disputes, enforce food safety & punctuality standards, and moderate accounts.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Reporter Role</label>
            <select
              value={reporterRoleFilter}
              onChange={(e) => {
                setReporterRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">All Reporters</option>
              <option value="customer">Customer Complaints</option>
              <option value="chef">Chef Complaints</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              {Object.entries(COMPLAINT_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {(statusFilter || categoryFilter || reporterRoleFilter) && (
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter('');
                  setCategoryFilter('');
                  setReporterRoleFilter('');
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Complaints List */}
      {isLoading ? (
        <SkeletonList count={4} />
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="No complaints found"
          description="Everything is running smoothly! No open complaints match your filter criteria."
        />
      ) : (
        <div className="space-y-4">
          {complaints.map((item) => {
            const role = item.reporterRole || item.raisedBy?.role || 'customer';
            return (
              <Card key={item._id} className="p-5 hover:border-gray-300 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getStatusBadge(item.status)}
                      {getReporterBadge(role)}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                        {COMPLAINT_CATEGORIES[item.category] || item.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        Filed on {formatDateTime(item.createdAt)}
                      </span>
                      {item.action && item.action !== 'none' && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-terracotta-100 text-terracotta-800 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Action: {item.action}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      "{item.description}"
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600 pt-1">
                      <div>
                        <span className="font-semibold text-gray-700">Complainant ({role}):</span>{' '}
                        {item.raisedBy?.name} ({item.raisedBy?.email})
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Accused Party:</span>{' '}
                        {item.against?.chefProfile?.kitchenName
                          ? `${item.against.chefProfile.kitchenName} (${item.against.name})`
                          : `${item.against?.name || 'User'} (${item.against?.role || 'User'})`}
                      </div>
                    </div>

                    {item.adminNote && (
                      <div className="text-xs text-gray-700 bg-primary-50 border border-primary-200 p-2.5 rounded-lg mt-2">
                        <span className="font-bold text-primary-900">Admin Note:</span> {item.adminNote}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 lg:flex-col lg:items-end">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenAction(item)}
                      icon={AlertTriangle}
                    >
                      Moderate & Resolve
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Resolution Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          title={`Moderate Complaint #${selectedComplaint._id.slice(-6)}`}
        >
          <form onSubmit={handleSaveResolution} className="space-y-4">
            <div className="p-3 bg-cream-50 border border-cream-200 rounded-lg text-xs space-y-1">
              <div>
                <strong>Reported:</strong> {COMPLAINT_CATEGORIES[selectedComplaint.category] || selectedComplaint.category}
              </div>
              <div>
                <strong>Complainant:</strong> {selectedComplaint.raisedBy?.name} ({selectedComplaint.reporterRole || selectedComplaint.raisedBy?.role})
              </div>
              <div>
                <strong>Target:</strong>{' '}
                {selectedComplaint.against?.chefProfile?.kitchenName || selectedComplaint.against?.name}
              </div>
              <div className="pt-1 text-gray-700 italic">
                "{selectedComplaint.description}"
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Investigation Status
              </label>
              <select
                value={resolutionStatus}
                onChange={(e) => setResolutionStatus(e.target.value)}
                className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="under_review">Under Review (In Progress)</option>
                <option value="resolved">Resolved (Issue addressed)</option>
                <option value="dismissed">Dismissed (Unsubstantiated)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Administrative Action on Accused
              </label>
              <select
                value={adminAction}
                onChange={(e) => setAdminAction(e.target.value)}
                className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="none">No Penalty / None</option>
                <option value="warning">Issue Official Warning</option>
                <option value="suspension">Immediate Account Suspension</option>
              </select>
              {adminAction === 'suspension' && (
                <p className="text-xs text-terracotta-600 mt-1 font-medium">
                  Warning: Selecting "Immediate Account Suspension" will instantly lock this user's account and revoke their active login sessions.
                </p>
              )}
            </div>

            {selectedComplaint.reservation && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="hideReviewCheck"
                  checked={hideReview}
                  onChange={(e) => setHideReview(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
                />
                <label htmlFor="hideReviewCheck" className="text-xs text-gray-700">
                  Hide customer's associated review on public chef profile (if abusive/in dispute)
                </label>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Admin Note / Audit Justification *
              </label>
              <textarea
                rows={3}
                required
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Explain the finding, direct communications, or resolution reasoning..."
                className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsActionModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={resolveMutation.isPending}
              >
                Save Resolution
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
