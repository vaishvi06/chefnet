import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/adminApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { Pagination } from '../../components/ui/Pagination';
import { formatDateTime } from '../../utils/formatters';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Mail,
  MapPin,
  Lock,
  Unlock
} from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminUsersPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [userToToggle, setUserToToggle] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', { search, roleFilter, page }],
    queryFn: async () => {
      const res = await adminApi.getUsers({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        page,
        limit: 10
      });
      return res.data?.data || {};
    }
  });

  const users = data?.users || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  const suspendMutation = useMutation({
    mutationFn: ({ userId, isSuspended }) =>
      adminApi.toggleSuspendUser(userId, { isSuspended, reason: 'Administrative moderation' }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.isSuspended ? 'User suspended successfully' : 'User reinstated successfully'
      );
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setIsConfirmOpen(false);
      setUserToToggle(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  });

  const handleToggleClick = (user) => {
    setUserToToggle(user);
    setIsConfirmOpen(true);
  };

  const handleConfirmToggle = () => {
    if (!userToToggle) return;
    suspendMutation.mutate({
      userId: userToToggle._id,
      isSuspended: !userToToggle.isSuspended
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
            User Management Directory
          </h1>
          <p className="text-sm text-gray-600">
            View all platform customers, home chefs, and administrators. Manage account statuses and suspensions.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or email address..."
              className="w-full pl-9 pr-4 py-2 text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500 py-2"
            >
              <option value="">All Roles</option>
              <option value="customer">Customers</option>
              <option value="chef">Home Chefs</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      {isLoading ? (
        <SkeletonList count={5} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Try adjusting your search keywords or role filters."
        />
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto bg-white rounded-xl shadow-card border border-cream-200">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-cream-100/70 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Verification</th>
                  <th className="px-5 py-3.5">Area</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Joined</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-cream-50/50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{u.name}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                      {u.chefProfile?.kitchenName && (
                        <div className="text-xs text-primary-700 font-semibold mt-0.5">
                          🍳 {u.chefProfile.kitchenName}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Badge
                        variant={
                          u.role === 'admin'
                            ? 'terracotta'
                            : u.role === 'chef'
                            ? 'saffron'
                            : 'neutral'
                        }
                      >
                        {u.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          {u.isEmailVerified ? (
                            <span className="text-primary-700 flex items-center gap-0.5">
                              <CheckCircle className="w-3 h-3" /> Email Verified
                            </span>
                          ) : (
                            <span className="text-terracotta-600 flex items-center gap-0.5">
                              <XCircle className="w-3 h-3" /> Unverified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          {u.isLocationVerified ? (
                            <span className="text-primary-700 flex items-center gap-0.5">
                              <CheckCircle className="w-3 h-3" /> Location OK
                            </span>
                          ) : (
                            <span className="text-gray-500">No Location</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-600">
                      {u.area ? (
                        <span className="font-medium text-gray-800">{u.area.name}</span>
                      ) : (
                        <span className="italic text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {u.isSuspended ? (
                        <Badge variant="terracotta">Suspended</Badge>
                      ) : (
                        <Badge variant="primary">Active</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500">
                      {formatDateTime(u.createdAt)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      {u.role !== 'admin' && (
                        <Button
                          size="xs"
                          variant={u.isSuspended ? 'outline' : 'danger'}
                          icon={u.isSuspended ? Unlock : Lock}
                          onClick={() => handleToggleClick(u)}
                        >
                          {u.isSuspended ? 'Reinstate' : 'Suspend'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmToggle}
        title={
          userToToggle?.isSuspended
            ? `Reinstate ${userToToggle?.name}?`
            : `Suspend ${userToToggle?.name}?`
        }
        message={
          userToToggle?.isSuspended
            ? 'This will immediately restore account access for this user.'
            : 'Suspending this user will instantly revoke all their active sessions and prevent them from making any reservations or managing their kitchen.'
        }
        confirmText={userToToggle?.isSuspended ? 'Reinstate User' : 'Suspend User'}
        confirmVariant={userToToggle?.isSuspended ? 'primary' : 'danger'}
        isLoading={suspendMutation.isPending}
      />
    </div>
  );
};

