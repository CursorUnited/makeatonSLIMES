import { forwardRef } from 'react';
import clsx from 'clsx';

export const Card = forwardRef(function Card({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={clsx('rounded-xl border border-gray-200 bg-white shadow-sm dark:border-darkborder dark:bg-darksurface', className)}
      {...props}
    >
      {children}
    </div>
  );
});

export function CardHeader({ title, actions, className }) {
  if (!title && !actions) return null;
  return (
    <div className={clsx('flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-darkborder', className)}>
      {title && <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={clsx('p-6', className)}>{children}</div>;
}
