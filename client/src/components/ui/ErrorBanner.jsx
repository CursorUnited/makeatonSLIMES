import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

export function ErrorBanner({ message = "Something went wrong.", onRetry }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-4 rounded-md border border-danger-700/30 bg-danger-50 px-4 py-3">
      <span className="flex items-center gap-2 text-sm text-danger-700">
        <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
        {message}
      </span>
      {onRetry && (
        <Button variant="secondary" className="h-8 shrink-0 px-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function OfflineBanner() {
  return (
    <div className="bg-gray-700 px-4 py-2 text-center text-sm text-white">
      You're offline. Changes can't be saved until the connection returns.
    </div>
  );
}
