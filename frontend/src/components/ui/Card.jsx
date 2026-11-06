import React from 'react';

export const Card = ({
  children,
  className = '',
  hover = false,
  padding = 'md',
  onClick,
  ...props
}) => {
  const paddings = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl border border-cream-300 shadow-sm
        ${hover ? 'hover:shadow-md hover:border-primary-300 transition-all duration-200 cursor-pointer' : ''}
        ${paddings[padding] || paddings.md}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

