import { forwardRef, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import clsx from 'clsx';
import { fieldBorder } from './FormField';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parseISO(value) {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** 6 weeks (42 days) starting the Sunday on/before the 1st of `month`. */
function buildGrid(year, month) {
  const offset = new Date(year, month, 1).getDay();
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

/**
 * Skeuomorphic desk-calendar date picker. Keeps the native-input contract (`value`/`onChange`
 * as "YYYY-MM-DD" strings via `event.target.value`, `ref`, `min`/`max`) so every existing call
 * site — including react-hook-form's `register()` — works unmodified.
 */
export const DateInput = forwardRef(function DateInput(
  { invalid, className, value, onChange, onBlur, name, disabled, min, max, 'aria-label': ariaLabel, ...props },
  ref,
) {
  const [open, setOpen] = useState(false);
  const selected = parseISO(value);
  const minDate = parseISO(min);
  const maxDate = parseISO(max);
  const [cursor, setCursor] = useState(() => selected ?? new Date());
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (open) setCursor(selected ?? new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e) {
      if (!popoverRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function pick(date) {
    if ((minDate && date < minDate) || (maxDate && date > maxDate)) return;
    onChange?.({ target: { name, value: toISO(date) } });
    setOpen(false);
    triggerRef.current?.focus();
  }

  function clear(e) {
    e.stopPropagation();
    onChange?.({ target: { name, value: '' } });
  }

  const grid = buildGrid(cursor.getFullYear(), cursor.getMonth());
  const today = new Date();

  return (
    <div className="relative">
      <button
        type="button"
        ref={(el) => {
          triggerRef.current = el;
          if (typeof ref === 'function') ref(el);
          else if (ref) ref.current = el;
        }}
        disabled={disabled}
        aria-label={ariaLabel ?? 'Choose a date'}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        onBlur={onBlur}
        className={clsx(fieldBorder(invalid), 'flex items-center justify-between gap-2 text-left', className)}
        {...props}
      >
        <span className={value ? '' : 'text-gray-400 dark:text-gray-500'}>{selected ? toISO(selected) : 'yyyy-mm-dd'}</span>
        <span className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={clear}
              aria-label="Clear date"
              className="rounded px-1 text-xs text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200"
            >
              &times;
            </span>
          )}
          <CalendarDays className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
        </span>
      </button>

      {open && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Calendar"
          className={clsx(
            'absolute z-30 mt-2 w-72 overflow-hidden rounded-2xl',
            'bg-[radial-gradient(circle_at_15%_15%,rgba(0,0,0,0.025)_0%,transparent_40%),radial-gradient(circle_at_85%_85%,rgba(0,0,0,0.025)_0%,transparent_40%),linear-gradient(#F8F2E2,#F0E8D4)]',
            'shadow-[0_2px_6px_rgba(60,45,20,0.15),0_18px_32px_-10px_rgba(60,45,20,0.45)]',
            'ring-1 ring-black/5',
            'dark:bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.03)_0%,transparent_40%),linear-gradient(#20160F,#15100B)]',
            'dark:shadow-[0_2px_6px_rgba(0,0,0,0.5),0_18px_32px_-10px_rgba(0,0,0,0.7)] dark:ring-white/5',
          )}
        >
          {/* spiral-bound header */}
          <div className="relative bg-danger-700 pb-3 pt-4 text-center dark:bg-[#5C1A14]">
            <div className="pointer-events-none absolute inset-x-0 -top-1 flex justify-center gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <span
                  key={i}
                  className="h-2.5 w-2.5 rounded-full bg-gray-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] dark:bg-gray-500"
                />
              ))}
            </div>
            <div className="flex items-center justify-between px-3">
              <button
                type="button"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                aria-label="Previous month"
                className="rounded-full bg-white/15 p-1 text-white shadow-[0_1px_1px_rgba(255,255,255,0.3)_inset,0_1px_2px_rgba(0,0,0,0.3)] hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-semibold uppercase tracking-wide text-white drop-shadow-sm">
                {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
              </p>
              <button
                type="button"
                onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                aria-label="Next month"
                className="rounded-full bg-white/15 p-1 text-white shadow-[0_1px_1px_rgba(255,255,255,0.3)_inset,0_1px_2px_rgba(0,0,0,0.3)] hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* torn perforation edge */}
          <div
            className="h-2 bg-[radial-gradient(circle,rgba(0,0,0,0.12)_55%,transparent_58%)] bg-[length:10px_10px] bg-repeat-x dark:bg-[radial-gradient(circle,rgba(0,0,0,0.4)_55%,transparent_58%)]"
            aria-hidden="true"
          />

          <div className="px-3 pb-3 pt-2">
            <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-gray-500 dark:text-gray-500">
              {WEEKDAYS.map((w, i) => (
                <span key={i}>{w}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {grid.map((d, i) => {
                const outOfMonth = d.getMonth() !== cursor.getMonth();
                const isToday = sameDay(d, today);
                const isSelected = sameDay(d, selected);
                const disabledCell = (minDate && d < minDate) || (maxDate && d > maxDate);
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={disabledCell}
                    onClick={() => pick(d)}
                    className={clsx(
                      'relative flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium transition-all',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700',
                      disabledCell && 'cursor-not-allowed opacity-30',
                      outOfMonth && !disabledCell && 'text-gray-400 dark:text-gray-600',
                      !outOfMonth &&
                        !isSelected &&
                        !disabledCell &&
                        'text-gray-700 shadow-[0_1px_1px_rgba(255,255,255,0.6)_inset,0_1px_2px_rgba(60,45,20,0.15)] hover:-translate-y-px hover:shadow-[0_1px_1px_rgba(255,255,255,0.6)_inset,0_3px_6px_rgba(60,45,20,0.25)] dark:text-gray-300 dark:shadow-[0_1px_1px_rgba(255,255,255,0.04)_inset,0_1px_2px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_1px_1px_rgba(255,255,255,0.04)_inset,0_3px_6px_rgba(0,0,0,0.5)]',
                      isSelected && 'bg-primary-700 text-white shadow-[0_1px_3px_rgba(0,0,0,0.4)_inset]',
                    )}
                  >
                    {isToday && !isSelected && (
                      <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-danger-700 shadow-[0_1px_1px_rgba(0,0,0,0.4)] dark:bg-danger-300" />
                    )}
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
