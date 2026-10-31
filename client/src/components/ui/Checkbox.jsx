import { forwardRef } from 'react';

export const Checkbox = forwardRef(function Checkbox({ label, hint, className, ...props }, ref) {
  return (
    <label className={'flex cursor-pointer items-start gap-2 ' + (className ?? '')}>
      <input
        ref={ref}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 focus-visible:ring-offset-1"
        {...props}
      />
      <span>
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      </span>
    </label>
  );
});

/** Pill-shaped on/off switch for list rows (e.g. Active toggle). */
export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 focus-visible:ring-offset-1 disabled:opacity-50 ' +
        (checked ? 'bg-primary-700' : 'bg-gray-300')
      }
    >
      <span className={'inline-block h-4 w-4 transform rounded-full bg-white transition-transform ' + (checked ? 'translate-x-6' : 'translate-x-1')} />
    </button>
  );
}
