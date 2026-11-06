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
import { LifeBuoy, CheckCircle2, MessageSquare, Clock, User, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminSupportPage = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Form states for modal
  const [ticketStatus, setTicketStatus] = useState('open');
  const [resolutionText, setResolutionText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['adminSupportTickets', { statusFilter, page }],
    queryFn: async () => {
      const res = await adminApi.getSupportTickets({
        status: statusFilter || undefined,
        page,
        limit: 10
      });
      return res.data?.data || {};
    }
  });

  const tickets = data?.tickets || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  const updateMutation = useMutation({
    mutationFn: (payload) => adminApi.updateSupportTicket(selectedTicket._id, payload),
    onSuccess: () => {
      toast.success('Support ticket updated successfully');
      queryClient.invalidateQueries({ queryKey: ['adminSupportTickets'] });
      setIsUpdateModalOpen(false);
      setSelectedTicket(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update ticket');
    }
  });

  const handleOpenUpdate = (ticket) => {
    setSelectedTicket(ticket);
    setTicketStatus(ticket.status);
    setResolutionText(ticket.resolution || '');
    setIsUpdateModalOpen(true);
  };

  const handleSaveTicket = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      status: ticketStatus,
      resolution: resolutionText.trim()
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <Badge variant="saffron">Open</Badge>;
      case 'in_progress':
        return <Badge variant="neutral">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="primary">Resolved</Badge>;
      case 'closed':
        return <Badge variant="neutral">Closed</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="terracotta">Urgent</Badge>;
      case 'high':
        return <Badge variant="saffron">High</Badge>;
      case 'medium':
        return <Badge variant="neutral">Medium</Badge>;
      default:
        return <Badge variant="neutral">Low</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
            Support Desk & Tickets
          </h1>
          <p className="text-sm text-gray-600">
            Handle technical issues, inquiries, and customer care tickets across the platform.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-white">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-full sm:w-64">
            <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Status</label>
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
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {statusFilter && (
            <div className="pt-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter('');
                  setPage(1);
                }}
              >
                Clear Filter
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Ticket List */}
      {isLoading ? (
        <SkeletonList count={4} />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No support tickets"
          description="There are currently no support tickets requiring attention."
        />
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket._id} className="p-5 hover:border-gray-300 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                    <span className="text-xs text-gray-500">
                      Opened {formatDateTime(ticket.createdAt)}
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      #{ticket._id.slice(-6)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900">{ticket.subject}</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {ticket.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 pt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      {ticket.user?.name} ({ticket.user?.email}) -{' '}
                      <span className="capitalize font-semibold text-gray-800">
                        {ticket.user?.role}
                      </span>
                    </span>
                    {ticket.assignedAdmin && (
                      <span className="flex items-center gap-1 text-primary-700">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Assigned: {ticket.assignedAdmin.name}
                      </span>
                    )}
                  </div>

                  {ticket.resolution && (
                    <div className="text-xs text-gray-700 bg-primary-50 border border-primary-200 p-2.5 rounded-lg mt-2">
                      <span className="font-bold text-primary-900">Resolution:</span>{' '}
                      {ticket.resolution}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 lg:flex-col lg:items-end">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleOpenUpdate(ticket)}
                    icon={MessageSquare}
                  >
                    Reply & Update
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Ticket Update Modal */}
      {selectedTicket && (
        <Modal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          title={`Update Ticket #${selectedTicket._id.slice(-6)}`}
        >
          <form onSubmit={handleSaveTicket} className="space-y-4">
            <div className="p-3 bg-cream-50 border border-cream-200 rounded-lg text-xs space-y-1">
              <div>
                <strong>From:</strong> {selectedTicket.user?.name} ({selectedTicket.user?.role})
              </div>
              <div>
                <strong>Subject:</strong> {selectedTicket.subject}
              </div>
              <div className="pt-1 text-gray-700 italic">"{selectedTicket.message}"</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Ticket Status
              </label>
              <select
                value={ticketStatus}
                onChange={(e) => setTicketStatus(e.target.value)}
                className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Resolution / Notes for User
              </label>
              <textarea
                rows={4}
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                placeholder="Write your response, actions taken, or instructions for the user..."
                className="w-full text-sm border-gray-300 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUpdateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={updateMutation.isPending}
              >
                Save Ticket Update
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

