const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

/** `"1234.50"` or number → `"₹ 1,234.50"`. Negative values render as `− ₹ 1,234.50`. */
export function formatINR(value) {
  const n = Number(value ?? 0);
  const formatted = currency.format(Math.abs(n)).replace('₹', '₹ ');
  return n < 0 ? `− ${formatted}` : formatted;
}

/** `"2026-10-31"` → `"31 Oct 2026"`. */
export function formatDate(value) {
  if (!value) return '—';
  return dateFmt.format(new Date(value));
}

/** ISO timestamp → `"31 Oct 2026 14:58"`. */
export function formatDateTime(value) {
  if (!value) return '—';
  return dateTimeFmt.format(new Date(value)).replace(',', '');
}

export function daysOverdue(dueDate) {
  const due = new Date(dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today - due) / 86400000));
}
