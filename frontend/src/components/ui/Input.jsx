import React from 'react';

export const Input = React.forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  rightElement,
  type = 'text',
  id,
  className = '',
  required = false,
  disabled = false,
  ...props
}, ref) => {
  const inputId = id || props.name || Math.random().toString(36).substring(2, 9);
  const errorId = `${inputId}-error`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5"
        >
          {label}
          {required && <span className="text-terracotta-600 ml-1">*</span>}
        </label>
      )}

      <div className="relative rounded-xl">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`
            w-full rounded-xl bg-white border text-sm text-neutral-800 placeholder-neutral-400
            transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed
            ${Icon ? 'pl-10' : 'pl-3.5'}
            ${rightElement ? 'pr-10' : 'pr-3.5'}
            py-2.5
            ${error
              ? 'border-terracotta-500 focus:ring-terracotta-400 bg-terracotta-50/20'
              : 'border-neutral-300 hover:border-neutral-400'
            }
            ${className}
          `}
          {...props}
        />

        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>

      {error ? (
        <p id={errorId} aria-live="polite" className="mt-1 text-xs text-terracotta-600 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-neutral-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';

