import clsx from 'clsx';

export function Skeleton({ className }) {
  return <div className={clsx('animate-pulse rounded bg-gray-200 dark:bg-darkborder', className)} aria-hidden="true" />;
}

export function SkeletonRows({ rows = 5, cols = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="px-4 py-3">
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
