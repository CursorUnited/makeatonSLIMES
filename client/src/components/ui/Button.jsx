import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-primary-700 text-white hover:bg-primary-800 disabled:bg-primary-700/50',
  secondary:
    'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 dark:bg-darksurface dark:text-gray-100 dark:border-darkborder dark:hover:bg-darkborder',
  destructive:
    'bg-white text-danger-700 border border-danger-700 hover:bg-danger-50 disabled:opacity-50 dark:bg-darksurface dark:hover:bg-danger-700/10',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-darkborder',
};

/** Primary/secondary/destructive/ghost button. 40px tall, spinner + auto-disable while `loading`. */
export function Button({ variant = 'secondary', loading = false, disabled, className, children, type = 'button', ...props }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed',
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function LinkButton({ className, children, ...props }) {
  return (
    <button
      type="button"
      className={clsx(
        'text-sm text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 rounded dark:text-primary-300',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
