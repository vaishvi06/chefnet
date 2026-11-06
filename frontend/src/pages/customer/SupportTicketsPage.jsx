import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LifeBuoy,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  User,
  ChefHat
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supportApi } from '../../api/supportApi';
import { complaintApi } from '../../api/complaintApi';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/formatters';
import { COMPLAINT_CATEGORIES } from '../../utils/constants';

export const SupportTicketsPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' | 'complaints'
  const [modalOpen, setModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Support Tickets Query
  const { data: ticketsData, isLoading: isLoadingTickets } = useQuery({
    queryKey: ['myTickets'],
    queryFn: () => supportApi.getMyTickets({ limit: 20 }),
    enabled: activeTab === 'tickets'
  });

  // Complaints Query
  const { data: complaintsData, isLoading: isLoadingComplaints } = useQuery({
    queryKey: ['myComplaints'],
    queryFn: () => complaintApi.getMyComplaints({ limit: 20 }),
    enabled: activeTab === 'complaints'
  });

  const tickets = ticketsData?.data?.tickets || [];
  const complaints = complaintsData?.data?.complaints || [];

  const createMutation = useMutation({
    mutationFn: (ticketData) => supportApi.createTicket(ticketData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTickets'] });
      setModalOpen(false);
      setSubject('');
      setMessage('');
      toast.success('Support ticket created. An agent will respond shortly.');
    },
    onError: (err) => toast.error(err.message || 'Failed to create ticket')
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <Badge variant="warning">Open</Badge>;
      case 'in_progress':
      case 'under_review':
        return <Badge variant="info">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="success">Resolved</Badge>;
      case 'closed':
      case 'dismissed':
        return <Badge variant="neutral">{status === 'dismissed' ? 'Dismissed' : 'Closed'}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
            ChiefNet Helpdesk & Moderation
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Assistance with offline payments, kitchen verifications, orders, and dispute resolution.
          </p>
        </div>

        {activeTab === 'tickets' && (
          <Button
            variant="primary"
            size="sm"
            icon={PlusCircle}
            onClick={() => setModalOpen(true)}
          >
            New Ticket
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-cream-200 gap-2">
        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors ${
            activeTab === 'tickets'
              ? 'bg-primary-50 text-primary-900 border-b-2 border-primary-800'
              : 'text-neutral-500 hover:text-neutral-800 hover:bg-cream-100'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Support Tickets ({tickets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('complaints')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-colors ${
            activeTab === 'complaints'
              ? 'bg-primary-50 text-primary-900 border-b-2 border-primary-800'
              : 'text-neutral-500 hover:text-neutral-800 hover:bg-cream-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-terracotta-600" />
          <span>My Complaints & Disputes ({complaints.length})</span>
        </button>
      </div>

      {/* Support Tickets Tab */}
      {activeTab === 'tickets' && (
        <>
          {isLoadingTickets ? (
            <Skeleton variant="card" count={2} />
          ) : tickets.length === 0 ? (
            <EmptyState
              icon={LifeBuoy}
              title="No Open Support Tickets"
              description="Everything running smoothly! If you ever need help with neighborhood food subscriptions, submit a ticket here."
              actionLabel="Create a Ticket"
              onAction={() => setModalOpen(true)}
            />
          ) : (
            <div className="space-y-4">
              {tickets.map((t) => (
                <Card key={t._id} className="p-5 border-cream-300 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-base text-neutral-900">{t.subject}</h3>
                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">{t.message}</p>
                    </div>
                    {getStatusBadge(t.status)}
                  </div>

                  {t.resolution && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Resolution from Support Team:</span>
                      </p>
                      <p className="text-neutral-700">{t.resolution}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-cream-200 flex items-center justify-between text-[11px] text-neutral-400">
                    <span>Ticket ID: {t._id.slice(-6).toUpperCase()}</span>
                    <span>Submitted on {formatDate(t.createdAt, 'dd MMM yyyy, hh:mm a')}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Complaints Tab */}
      {activeTab === 'complaints' && (
        <>
          {isLoadingComplaints ? (
            <Skeleton variant="card" count={2} />
          ) : complaints.length === 0 ? (
            <EmptyState
              icon={AlertTriangle}
              title="No Complaints Raised"
              description="You have not filed any complaints. If you experience food quality, hygiene, or pickup issues, you can file a complaint directly from your order or subscription."
            />
          ) : (
            <div className="space-y-4">
              {complaints.map((c) => (
                <Card key={c._id} className="p-5 border-cream-300 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-cream-200 text-neutral-800">
                          {COMPLAINT_CATEGORIES[c.category] || c.category}
                        </span>
                        {getStatusBadge(c.status)}
                      </div>

                      <p className="text-xs text-neutral-500">
                        Target:{' '}
                        <strong className="text-neutral-800">
                          {c.against?.chefProfile?.kitchenName || c.against?.name || 'User'}
                        </strong>
                      </p>
                    </div>

                    <span className="text-[11px] text-neutral-400">
                      {formatDate(c.createdAt, 'dd MMM yyyy')}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-700 bg-cream-50 p-3 rounded-xl border border-cream-200">
                    "{c.description}"
                  </p>

                  {/* Admin Resolution & Action */}
                  {c.adminNote && (
                    <div className="p-3 bg-primary-50 border border-primary-200 rounded-xl text-xs space-y-1">
                      <p className="font-bold text-primary-900 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-primary-700" />
                        <span>Admin Findings & Resolution:</span>
                      </p>
                      <p className="text-neutral-800">{c.adminNote}</p>
                      {c.action && c.action !== 'none' && (
                        <p className="text-[11px] text-primary-800 font-semibold pt-1">
                          Enforced Action on Accused: {c.action.toUpperCase()}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-cream-200 flex items-center justify-between text-[11px] text-neutral-400">
                    <span>Complaint #{c._id.slice(-6).toUpperCase()}</span>
                    <span>Status: {c.status}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* New Ticket Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Open Support Ticket"
        description="Describe your question or issue clearly so our support team can assist you."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!subject.trim() || !message.trim()) {
              toast.error('Please enter subject and message');
              return;
            }
            createMutation.mutate({ subject: subject.trim(), message: message.trim() });
          }}
          className="space-y-4"
        >
          <Input
            label="Subject"
            required
            placeholder="e.g. Issue with pickup timing / payment query"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5">
              Message Details <span className="text-terracotta-600">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Explain the problem or inquiry in detail..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-xl border border-cream-300 p-3 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" loading={createMutation.isPending}>
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
