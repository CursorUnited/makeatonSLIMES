import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { fieldBorder } from './FormField';

export const Input = forwardRef(function Input({ invalid, className, ...props }, ref) {
  return <input ref={ref} className={fieldBorder(invalid) + ' ' + (className ?? '')} {...props} />;
});

/** Password input with a show/hide toggle. */
export const PasswordInput = forwardRef(function PasswordInput({ invalid, className, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input ref={ref} type={visible ? 'text' : 'password'} className={fieldBorder(invalid) + ' pr-10 ' + (className ?? '')} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 rounded"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});
