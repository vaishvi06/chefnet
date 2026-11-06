import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ToggleLeft, Calendar, Sun, Clock, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { chefApi } from '../../api/chefApi';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { AVAILABILITY_STATUSES } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

export const ChefAvailabilityPage = () => {
  const { user, refreshUser } = useAuth();
  const [vacationModalOpen, setVacationModalOpen] = useState(false);
  const [vacationData, setVacationData] = useState({ from: '', to: '', reason: '' });

  const currentStatus = user?.chefProfile?.availabilityStatus || 'accepting';
  const vacations = user?.chefProfile?.vacationPeriods || [];

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status) => chefApi.updateAvailability(status),
    onSuccess: async (res) => {
      await refreshUser();
      toast.success(res.message || 'Availability status updated!');
    },
    onError: (err) => toast.error(err.message || 'Failed to update status')
  });

  // Add vacation mutation
  const addVacationMutation = useMutation({
    mutationFn: (data) => chefApi.addVacation(data),
    onSuccess: async () => {
      await refreshUser();
      setVacationModalOpen(false);
      setVacationData({ from: '', to: '', reason: '' });
      toast.success('Vacation period scheduled!');
    },
    onError: (err) => toast.error(err.message || 'Failed to schedule vacation')
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
          Kitchen Availability & Schedule
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
          Control how neighbourhood subscribers see your kitchen and schedule upcoming breaks.
        </p>
      </div>

      {/* Status Switcher Card */}
      <Card className="p-6 border-cream-300 space-y-4">
        <div>
          <h3 className="font-serif font-bold text-base text-neutral-900">
            Current Subscription Availability
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Select a state to reflect your current kitchen capacity on the discovery map
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(AVAILABILITY_STATUSES).map(([key, config]) => {
            const isSelected = currentStatus === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => updateStatusMutation.mutate(key)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? `${config.bg} ring-2 ring-primary-500/30 font-bold shadow-xs`
                    : 'bg-white border-cream-300 hover:border-neutral-300 text-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{config.label}</span>
                  {isSelected && <Badge variant="primary" size="sm">Active</Badge>}
                </div>
                <p className="text-xs text-neutral-500 mt-1 font-normal">
                  {key === 'accepting' && 'Open for new neighbourhood subscribers.'}
                  {key === 'limited' && 'Only a few meal slots remaining today.'}
                  {key === 'full' && 'Daily capacity reached. New requests auto-declined.'}
                  {key === 'paused' && 'Temporarily paused. Hidden from discovery map.'}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Vacation Periods */}
      <Card className="p-6 border-cream-300 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-base text-neutral-900">
              Scheduled Vacations & Off Days
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Subscribers will be alerted and reservations paused during these dates
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={PlusCircle}
            onClick={() => setVacationModalOpen(true)}
          >
            Add Break
          </Button>
        </div>

        {vacations.length === 0 ? (
          <p className="text-xs text-neutral-400 p-4 bg-cream-50 rounded-xl text-center">
            No vacations scheduled. Cooking 7 days a week!
          </p>
        ) : (
          <div className="space-y-2">
            {vacations.map((vac, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3.5 bg-cream-50 rounded-xl border border-cream-200 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                  <div>
                    <span className="font-bold text-neutral-800">
                      {formatDate(vac.from)} &mdash; {formatDate(vac.to)}
                    </span>
                    <p className="text-neutral-500 text-[11px] mt-0.5">
                      {vac.reason || 'Personal Vacation'}
                    </p>
                  </div>
                </div>

                <Badge variant="warning" size="sm">
                  Off Duty
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Vacation Modal */}
      <Modal
        isOpen={vacationModalOpen}
        onClose={() => setVacationModalOpen(false)}
        title="Schedule Vacation / Holiday"
        description="Select date range when your kitchen will be closed."
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addVacationMutation.mutate(vacationData);
          }}
          className="space-y-4"
        >
          <Input
            label="Start Date"
            type="date"
            required
            value={vacationData.from}
            onChange={(e) => setVacationData({ ...vacationData, from: e.target.value })}
          />

          <Input
            label="End Date"
            type="date"
            required
            value={vacationData.to}
            onChange={(e) => setVacationData({ ...vacationData, to: e.target.value })}
          />

          <Input
            label="Reason / Note"
            placeholder="e.g. Festival vacation / family function"
            value={vacationData.reason}
            onChange={(e) => setVacationData({ ...vacationData, reason: e.target.value })}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setVacationModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={addVacationMutation.isPending}
            >
              Save Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

