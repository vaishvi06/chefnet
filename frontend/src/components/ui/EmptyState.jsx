import React from 'react';
import { Utensils } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon = Utensils,
  title = 'No items found',
  description = 'There are no records to display at this moment.',
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center p-8 sm:p-12
        rounded-2xl border border-dashed border-cream-300 bg-cream-50/50
        ${className}
      `}
    >
      <div className="w-14 h-14 rounded-full bg-cream-200 text-primary-700 flex items-center justify-center mb-4 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-base sm:text-lg font-serif font-bold text-neutral-800">
        {title}
      </h3>
      <p className="mt-1.5 text-xs sm:text-sm text-neutral-500 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

