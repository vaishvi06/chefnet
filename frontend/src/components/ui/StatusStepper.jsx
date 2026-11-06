import React from 'react';
import { Check, Clock, UtensilsCrossed, PackageCheck, AlertCircle } from 'lucide-react';

const STEPS = [
  { id: 'reserved', label: 'Reserved', icon: Clock },
  { id: 'preparing', label: 'Preparing', icon: UtensilsCrossed },
  { id: 'ready', label: 'Ready for Pickup', icon: PackageCheck },
  { id: 'picked_up', label: 'Picked Up', icon: Check }
];

export const StatusStepper = ({ currentStatus, isMissed = false }) => {
  if (isMissed || currentStatus === 'missed') {
    return (
      <div className="flex items-center gap-2 p-3 bg-terracotta-50 border border-terracotta-200 rounded-xl text-terracotta-700 text-sm font-medium">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>Pickup Missed — Meal was prepared but not collected during the pickup window.</span>
      </div>
    );
  }

  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center gap-2 p-3 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-600 text-sm font-medium">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>Reservation Cancelled.</span>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.id === currentStatus);
  const activeIndex = currentIdx === -1 ? 0 : currentIdx;

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative">
        {/* Background track line */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-neutral-200 -z-0" />

        {/* Progress track line */}
        <div
          className="absolute top-1/2 left-4 -translate-y-1/2 h-1 bg-primary-600 transition-all duration-300 -z-0"
          style={{ width: `${(activeIndex / (STEPS.length - 1)) * 90}%` }}
        />

        {STEPS.map((step, idx) => {
          const isDone = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                  transition-all duration-200
                  ${isDone
                    ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                    : isCurrent
                    ? 'bg-saffron-500 text-white ring-4 ring-saffron-100 scale-110 shadow-sm'
                    : 'bg-white border-2 border-neutral-300 text-neutral-400'
                  }
                `}
              >
                {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`
                  mt-1.5 text-[11px] sm:text-xs font-medium text-center
                  ${isCurrent
                    ? 'text-saffron-800 font-bold'
                    : isDone
                    ? 'text-primary-800'
                    : 'text-neutral-400'
                  }
                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

