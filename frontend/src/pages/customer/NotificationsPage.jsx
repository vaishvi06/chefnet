import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationApi } from '../../api/notificationApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/formatters';

export const NotificationsPage = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getNotifications({ limit: 30 })
  });

  const notifications = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;

  const markAllMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All marked as read');
    }
  });

  const markOneMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
            Notifications
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Real-time updates on meal preparation, pickups, and subscription status.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            icon={CheckCheck}
            onClick={() => markAllMutation.mutate()}
            loading={markAllMutation.isPending}
          >
            Mark All Read
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton variant="card" count={3} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No Notifications"
          description="You are completely caught up! We will ping you when your meal starts preparing."
        />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => (
            <Card
              key={notif._id}
              onClick={() => !notif.isRead && markOneMutation.mutate(notif._id)}
              className={`p-4 border transition-all cursor-pointer ${
                notif.isRead
                  ? 'border-cream-200 bg-white'
                  : 'border-primary-300 bg-primary-50/40 shadow-xs ring-1 ring-primary-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    notif.isRead ? 'bg-cream-100 text-neutral-500' : 'bg-primary-600 text-white shadow-2xs'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-xs sm:text-sm ${notif.isRead ? 'text-neutral-700' : 'text-neutral-900 font-bold'}`}>
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    {formatDate(notif.createdAt, 'dd MMM yyyy, hh:mm a')}
                  </span>
                </div>

                {!notif.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-saffron-500 shrink-0 mt-1.5" />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

