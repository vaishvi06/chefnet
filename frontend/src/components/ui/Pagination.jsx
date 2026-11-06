import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export const Pagination = ({
  page = 1,
  pages = 1,
  total = 0,
  onPageChange,
  className = ''
}) => {
  if (pages <= 1) return null;

  return (
    <div className={`flex items-center justify-between border-t border-cream-200 px-2 py-4 ${className}`}>
      <div className="text-xs text-neutral-500">
        Page <span className="font-semibold text-neutral-800">{page}</span> of{' '}
        <span className="font-semibold text-neutral-800">{pages}</span>
        {total > 0 && <span> ({total} total items)</span>}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          icon={ChevronLeft}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

