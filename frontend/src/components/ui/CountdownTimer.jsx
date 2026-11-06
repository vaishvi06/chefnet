import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { useCountdown } from '../../hooks/useCountdown';

export const CountdownTimer = ({ cutoffTime, className = '' }) => {
  const { hours, minutes, seconds, isExpired } = useCountdown(cutoffTime);

  if (isExpired) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-600 border border-neutral-200 text-xs font-semibold ${className}`}
        role="timer"
        aria-live="polite"
      >
        <AlertCircle className="w-3.5 h-3.5 text-neutral-500" />
        <span>Cutoff time passed</span>
      </div>
    );
  }

  const isUrgent = hours === 0 && minutes < 30;
  const isModerate = hours < 2;

  const pad = (n) => n.toString().padStart(2, '0');

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold tracking-wide
        ${isUrgent
          ? 'bg-terracotta-50 text-terracotta-700 border-terracotta-300 animate-pulse'
          : isModerate
          ? 'bg-saffron-50 text-saffron-800 border-saffron-300'
          : 'bg-primary-50 text-primary-800 border-primary-200'
        }
        ${className}
      `}
      role="timer"
      aria-live="polite"
    >
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <span>
        Closes in {hours > 0 ? `${hours}h ` : ''}{pad(minutes)}m {pad(seconds)}s
      </span>
    </div>
  );
};

