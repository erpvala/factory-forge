import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ErrorStateProps = {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again. If the issue continues, contact support.',
  retryLabel = 'Retry',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`rounded-xl border border-red-500/40 bg-red-500/10 p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-red-300" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-red-100">{title}</p>
          <p className="mt-1 text-sm text-red-200/90">{description}</p>
          {onRetry && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3 border-red-300/40 bg-transparent text-red-100 hover:bg-red-500/15"
              onClick={onRetry}
            >
              {retryLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
