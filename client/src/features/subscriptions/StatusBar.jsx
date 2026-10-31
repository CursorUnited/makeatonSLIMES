import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';
import { StatusBadge } from '../../components/ui';

const STEPS = ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED'];
const LABELS = { DRAFT: 'Draft', QUOTATION: 'Quotation', CONFIRMED: 'Confirmed', ACTIVE: 'Active', CLOSED: 'Closed' };

/** Chevron status bar (UI_UX_SPEC §5.6). Paused renders as a side badge, not a step. */
export function StatusBar({ status }) {
  const effectiveStep = status === 'PAUSED' ? 'ACTIVE' : status;
  const currentIdx = STEPS.indexOf(effectiveStep);

  return (
    <div className="flex items-center gap-3">
      <ol className="flex items-center" aria-label="Subscription status">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-center">
            {i > 0 && <ChevronRight className="h-4 w-4 text-gray-300" aria-hidden="true" />}
            <span
              aria-current={step === effectiveStep ? 'step' : undefined}
              className={clsx(
                'rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap',
                step === effectiveStep
                  ? 'bg-primary-700 text-white'
                  : i < currentIdx
                    ? 'bg-primary-50 text-primary-700'
                    : 'bg-white text-gray-400 border border-gray-200',
              )}
            >
              {LABELS[step]}
            </span>
          </li>
        ))}
      </ol>
      {status === 'PAUSED' && <StatusBadge kind="subscription" status="PAUSED" />}
    </div>
  );
}
