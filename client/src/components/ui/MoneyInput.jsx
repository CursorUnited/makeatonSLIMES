import { forwardRef } from 'react';
import { fieldBorder } from './FormField';

/**
 * Rupee-prefixed numeric input. Value/onChange are plain decimal strings ("1234.50"),
 * matching the API's money-as-string convention — never parses to float.
 */
export const MoneyInput = forwardRef(function MoneyInput({ invalid, className, value, onChange, ...props }, ref) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-500">₹</span>
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={value ?? ''}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) onChange?.(v);
        }}
        className={fieldBorder(invalid) + ' pl-7 text-right tabular-nums ' + (className ?? '')}
        {...props}
      />
    </div>
  );
});
