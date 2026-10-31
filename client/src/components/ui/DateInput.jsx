import { forwardRef } from 'react';
import { fieldBorder } from './FormField';

/** Native date input. Value/onChange are `YYYY-MM-DD` strings, matching the API. */
export const DateInput = forwardRef(function DateInput({ invalid, className, ...props }, ref) {
  return <input ref={ref} type="date" className={fieldBorder(invalid) + ' ' + (className ?? '')} {...props} />;
});
