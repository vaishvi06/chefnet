import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const QueryErrorState = ({
  error,
  onRetry,
  title = 'Unable to Load Information',
  message
}) => {
  const displayMsg =
    message ||
    error?.message ||
    'An unexpected network error occurred while communicating with ChiefNet servers.';

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.error('[ChiefNet Query Error]:', error);
    }
  }, [error]);

  return (
    <Card className="p-8 text-center bg-terracotta-50/50 border-terracotta-200 space-y-3 max-w-xl mx-auto my-4 shadow-sm">
      <div className="w-12 h-12 rounded-2xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-serif font-bold text-neutral-900">{title}</h3>
      <p className="text-xs sm:text-sm text-terracotta-800 max-w-md mx-auto leading-relaxed">
        {displayMsg}
      </p>
      {onRetry && (
        <div className="pt-2">
          <Button variant="outline" size="sm" onClick={onRetry} icon={RefreshCw}>
            Try Again
          </Button>
        </div>
      )}
    </Card>
  );
};

