import clsx from 'clsx';

/** Rounded-pill segmented control for list quick-filters. `options`: [{ value, label, count? }]. */
export function PillFilter({ options, value, onChange }) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={clsx(
              'inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 focus-visible:ring-offset-1',
              active
                ? 'bg-primary-700 text-white dark:bg-primary-700'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-darkborder dark:bg-darksurface dark:text-gray-300 dark:hover:bg-darkborder',
            )}
          >
            {o.label}
            {o.count != null && (
              <span className={clsx('rounded-full px-1.5 text-xs', active ? 'bg-white/20' : 'bg-gray-100 dark:bg-darkborder')}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
