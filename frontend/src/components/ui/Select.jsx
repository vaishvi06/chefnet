import React from 'react';

export const Select = React.forwardRef(({
  label,
  error,
  helperText,
  options = [],
  placeholder = 'Select an option',
  id,
  className = '',
  required = false,
  disabled = false,
  ...props
}, ref) => {
  const selectId = id || props.name || Math.random().toString(36).substring(2, 9);
  const errorId = `${selectId}-error`;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold uppercase tracking-wider text-neutral-700 mb-1.5"
        >
          {label}
          {required && <span className="text-terracotta-600 ml-1">*</span>}
        </label>
      )}

      <div className="relative rounded-xl">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`
            w-full rounded-xl bg-white border text-sm text-neutral-800
            transition-all duration-150 appearance-none
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed
            pl-3.5 pr-10 py-2.5
            ${error
              ? 'border-terracotta-500 focus:ring-terracotta-400 bg-terracotta-50/20'
              : 'border-neutral-300 hover:border-neutral-400'
            }
            ${className}
          `}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const value = typeof opt === 'object' ? opt.value : opt;
            const text = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={value} value={value}>
                {text}
              </option>
            );
          })}
        </select>

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-neutral-400">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
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

Select.displayName = 'Select';

