import { forwardRef } from 'react';
import clsx from 'clsx';

export const Textarea = forwardRef(function Textarea({ invalid, className, rows = 3, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={clsx(
        'w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400',
        'dark:bg-darksurface dark:text-gray-100 dark:placeholder:text-gray-500',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-darkbg',
        'disabled:bg-gray-50 disabled:text-gray-400 dark:disabled:bg-darkborder/40 dark:disabled:text-gray-500',
        invalid ? 'border-danger-700 dark:border-danger-300' : 'border-gray-300 dark:border-darkborder',
        className,
      )}
      {...props}
    />
  );
});
