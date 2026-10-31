import clsx from 'clsx';
import { Pencil, FileText, Check, Play, Pause, Lock, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';

const TONES = {
  gray: 'bg-gray-100 text-gray-700 dark:bg-darkborder dark:text-gray-300',
  grayDark: 'bg-gray-700 text-white dark:bg-gray-600',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-700/15 dark:text-warning-300',
  info: 'bg-info-50 text-info-700 dark:bg-info-700/15 dark:text-info-300',
  success: 'bg-success-50 text-success-700 dark:bg-success-700/15 dark:text-success-300',
  dangerSolid: 'bg-danger-700 text-white dark:bg-danger-700',
  dangerOutline: 'bg-white text-danger-700 border border-danger-700 dark:bg-darksurface dark:text-danger-300 dark:border-danger-300/60',
};

const SUBSCRIPTION = {
  DRAFT: { tone: 'gray', icon: Pencil, text: 'Draft' },
  QUOTATION: { tone: 'warning', icon: FileText, text: 'Quotation' },
  CONFIRMED: { tone: 'info', icon: Check, text: 'Confirmed' },
  ACTIVE: { tone: 'success', icon: Play, text: 'Active' },
  PAUSED: { tone: 'warning', icon: Pause, text: 'Paused' },
  CLOSED: { tone: 'grayDark', icon: Lock, text: 'Closed' },
};

const INVOICE = {
  DRAFT: { tone: 'gray', icon: Pencil, text: 'Draft' },
  CONFIRMED: { tone: 'info', icon: Check, text: 'Confirmed' },
  PAID: { tone: 'success', icon: CheckCircle2, text: 'Paid' },
  CANCELLED: { tone: 'dangerOutline', icon: XCircle, text: 'Cancelled' },
};

const DISCOUNT = {
  ACTIVE: { tone: 'success', icon: Check, text: 'Active' },
  SCHEDULED: { tone: 'info', icon: Clock, text: 'Scheduled' },
  EXPIRED: { tone: 'gray', icon: Clock, text: 'Expired' },
  EXHAUSTED: { tone: 'gray', icon: Lock, text: 'Used up' },
  INACTIVE: { tone: 'gray', icon: Pencil, text: 'Inactive' },
};

function Badge({ tone, icon: Icon, text }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', TONES[tone])}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {text}
    </span>
  );
}

/** `kind`: "subscription" | "invoice" | "discount". `status` is the enum value. */
export function StatusBadge({ kind, status }) {
  const map = kind === 'invoice' ? INVOICE : kind === 'discount' ? DISCOUNT : SUBSCRIPTION;
  const spec = map[status];
  if (!spec) return <Badge tone="gray" icon={Pencil} text={status ?? 'Unknown'} />;
  return <Badge {...spec} />;
}

export function OverdueBadge({ days }) {
  return <Badge tone="dangerSolid" icon={AlertTriangle} text={`Overdue · ${days} day${days === 1 ? '' : 's'}`} />;
}

export function ExpiredQuoteBadge() {
  return <Badge tone="dangerOutline" icon={Clock} text="Expired quote" />;
}
