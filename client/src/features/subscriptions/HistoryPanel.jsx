import { Skeleton } from '../../components/ui';
import { formatDateTime } from '../../lib/format';

/** Renders the subscription's event log (GET /subscriptions/:id/events), newest first. */
export function HistoryPanel({ events, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (!events?.length) {
    return <p className="text-sm text-gray-500 dark:text-gray-500">No history yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {events.map((e) => (
        <li key={e.id} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" aria-hidden="true" />
          <span>
            <span className="text-gray-500 dark:text-gray-500">{formatDateTime(e.createdAt)}</span>{' '}
            <span className="font-medium text-gray-900 dark:text-gray-100">{e.user?.name ?? 'System'}</span>{' '}
            {e.fromStatus} &rarr; {e.toStatus}
            {e.note && <span className="text-gray-600 dark:text-gray-400"> &ldquo;{e.note}&rdquo;</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}
