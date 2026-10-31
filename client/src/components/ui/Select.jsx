import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { fieldBorder } from './FormField';

/** `options`: [{ value, label }]. Pass `placeholder` for an empty leading option. */
export const Select = forwardRef(function Select({ invalid, className, options = [], placeholder, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={fieldBorder(invalid) + ' appearance-none pr-9 ' + (className ?? '')} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" aria-hidden="true" />
    </div>
  );
});
