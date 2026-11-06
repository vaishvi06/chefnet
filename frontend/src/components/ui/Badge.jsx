import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = ''
}) => {
  const variants = {
    neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-terracotta-50 text-terracotta-700 border-terracotta-200',
    saffron: 'bg-saffron-50 text-saffron-800 border-saffron-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200'
  };

  const dotColors = {
    neutral: 'bg-neutral-400',
    primary: 'bg-primary-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-terracotta-500',
    saffron: 'bg-saffron-500',
    info: 'bg-blue-500'
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2'
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${variants[variant] || variants.neutral}
        ${sizes[size] || sizes.md}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.neutral}`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
};

