import { forwardRef } from 'react';
import clsx from 'clsx';

export const Textarea = forwardRef(function Textarea({ invalid, className, rows = 3, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={clsx(
        'w-full rounded-md border bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 focus-visible:ring-offset-1',
        'disabled:bg-gray-50 disabled:text-gray-400',
        invalid ? 'border-danger-700' : 'border-gray-300',
        className,
      )}
      {...props}
    />
  );
});
