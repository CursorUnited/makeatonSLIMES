export function EmptyState({ title, action, icon: Icon }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      {Icon && <Icon className="h-8 w-8 text-gray-400 dark:text-gray-600" aria-hidden="true" />}
      <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
      {action}
    </div>
  );
}
