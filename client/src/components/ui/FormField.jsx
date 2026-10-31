import clsx from 'clsx';

let uid = 0;
const nextId = () => `field-${++uid}`;

/**
 * Label + control + helper/error text, wired with aria-describedby/aria-invalid.
 * Pass a render function as children: `{(inputProps) => <Input {...inputProps} />}`.
 */
export function FormField({ label, hint, error, required, children, optional }) {
  const id = nextId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-600">
        {label}
        {optional && <span className="font-normal text-gray-400"> (optional)</span>}
        {required && <span className="text-danger-700"> *</span>}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? 'true' : undefined, invalid: Boolean(error) })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}

export const fieldBorder = (invalid) =>
  clsx(
    'h-10 w-full rounded-md border bg-white px-3 text-base text-gray-900 placeholder:text-gray-400',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 focus-visible:ring-offset-1',
    'disabled:bg-gray-50 disabled:text-gray-400',
    invalid ? 'border-danger-700' : 'border-gray-300',
  );
