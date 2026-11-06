import React from 'react';

export const Skeleton = ({ className = '', variant = 'text', count = 1 }) => {
  const variants = {
    text: 'h-4 w-full rounded',
    title: 'h-6 w-3/4 rounded-lg',
    circle: 'rounded-full',
    card: 'h-44 w-full rounded-2xl',
    thumbnail: 'h-24 w-24 rounded-xl'
  };

  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={`
            animate-pulse bg-cream-200/80
            ${variants[variant] || variants.text}
            ${className}
          `}
        />
      ))}
    </>
  );
};

export const SkeletonList = ({ count = 3, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="p-4 bg-white rounded-xl border border-cream-200 animate-pulse space-y-3">
        <div className="h-4 bg-cream-200 rounded w-1/3" />
        <div className="h-3 bg-cream-200 rounded w-full" />
        <div className="h-3 bg-cream-200 rounded w-2/3" />
      </div>
    ))}
  </div>
);
