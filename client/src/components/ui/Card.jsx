import clsx from 'clsx';

export function Card({ className, children, ...props }) {
  return (
    <div className={clsx('rounded-lg border border-gray-200 bg-white shadow-sm', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, actions, className }) {
  if (!title && !actions) return null;
  return (
    <div className={clsx('flex items-center justify-between border-b border-gray-200 px-6 py-4', className)}>
      {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={clsx('p-6', className)}>{children}</div>;
}
