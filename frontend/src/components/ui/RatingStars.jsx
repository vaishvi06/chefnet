import React, { useState } from 'react';
import { Star } from 'lucide-react';

export const RatingStars = ({
  value = 0,
  max = 5,
  onChange,
  size = 'md',
  count,
  interactive = false,
  className = ''
}) => {
  const [hoverValue, setHoverValue] = useState(null);

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  const activeValue = hoverValue !== null ? hoverValue : value;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }, (_, index) => {
          const starNum = index + 1;
          const isFilled = starNum <= activeValue;

          return (
            <button
              key={starNum}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(starNum)}
              onMouseEnter={() => interactive && setHoverValue(starNum)}
              onMouseLeave={() => interactive && setHoverValue(null)}
              className={`
                transition-all duration-100
                ${interactive ? 'cursor-pointer hover:scale-125 focus:outline-none' : 'cursor-default'}
              `}
              aria-label={`${starNum} of ${max} stars`}
            >
              <Star
                className={`
                  ${starSizes[size] || starSizes.md}
                  ${isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-transparent text-neutral-300'
                  }
                `}
              />
            </button>
          );
        })}
      </div>

      {value > 0 && !interactive && (
        <span className="text-xs font-semibold text-neutral-800">
          {Number(value).toFixed(1)}
        </span>
      )}

      {count !== undefined && !interactive && (
        <span className="text-[11px] text-neutral-400">
          ({count})
        </span>
      )}
    </div>
  );
};

