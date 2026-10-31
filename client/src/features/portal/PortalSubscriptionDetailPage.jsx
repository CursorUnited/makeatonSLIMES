import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader, Card, CardHeader, CardBody, StatusBadge, OverdueBadge, Button, ConfirmDialog, ErrorBanner, Skeleton, useToast } from '../../components/ui';
import { formatINR, formatDate, daysOverdue } from '../../lib/format';
import { getSubscription, listInvoicesForSubscription, runSubscriptionAction } from '../../api/portal';

const PERIOD_LABEL = { DAILY: 'day', WEEKLY: 'week', MONTHLY: 'month', YEARLY: 'year' };

const ACTIONS = {
  pause: {
    label: 'Pause billing',
    title: 'Pause billing?',
    message: "You won't be billed until you resume. You can resume any time.",
    confirmLabel: 'Pause billing',
    success: 'Billing paused.',
  },
  resume: {
    label: 'Resume billing',
    title: 'Resume billing?',
    message: "You'll be billed again starting from your next billing date.",
    confirmLabel: 'Resume billing',
    success: 'Billing resumed.',
  },
  renew: {
    label: 'Renew for another term',
    title: 'Renew for another term?',
    message: "We'll extend your subscription for another term and keep billing you as usual.",
    confirmLabel: 'Renew',
    success: 'Subscription renewed.',
  },
  close: {
    label: 'Close subscription',
    title: 'Close this subscription?',
    message: "This can't be undone.",
    confirmLabel: 'Close subscription',
    destructive: true,
    success: 'Subscription closed.',
  },
};

export function PortalSubscriptionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState(null);

  const { data: sub, isLoading, error, refetch } = useQuery({
    queryKey: ['portal-subscription', id],
    queryFn: () => getSubscription(id),
  });

  const { data: invoices } = useQuery({
    queryKey: ['portal-subscription-invoices', id],
    queryFn: () => listInvoicesForSubscription(id),
  });

  const mutation = useMutation({
    mutationFn: ({ action, note }) => runSubscriptionAction(id, action, note),
    onSuccess: (_data, { action }) => {
      toast(ACTIONS[action].success);
      setConfirmAction(null);
      queryClient.invalidateQueries({ queryKey: ['portal-subscription', id] });
      queryClient.invalidateQueries({ queryKey: ['portal-subscriptions'] });
    },
    onError: (err) => toast(err.message, 'danger'),
  });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Subscription" breadcrumb="My subscriptions" />
        <Card>
          <CardBody className="flex flex-col gap-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error || !sub) {
    return (
      <div>
        <PageHeader title="Subscription" breadcrumb="My subscriptions" />
        <ErrorBanner message="We couldn't find that page or record." onRetry={refetch} />
      </div>
    );
  }

  const period = PERIOD_LABEL[sub.plan.billingPeriod] ?? sub.plan.billingPeriod.toLowerCase();
  const linesSummary = sub.lines.map((l) => `${l.product.name}${l.variant ? ' · ' + l.variant.label : ''} × ${l.quantity}`).join(', ');

  return (
    <div>
      <PageHeader
        title={sub.plan.name}
        breadcrumb="My subscriptions"
        actions={
          <Button variant="secondary" onClick={() => navigate('/portal/subscriptions')}>
            Back
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader title="What you pay" actions={<StatusBadge kind="subscription" status={sub.status} />} />
          <CardBody className="flex flex-col gap-3">
            <div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{formatINR(sub.totals.total)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">every {period} (incl. GST)</p>
            </div>
            {linesSummary && <p className="text-sm text-gray-600 dark:text-gray-400">{linesSummary}</p>}
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-gray-500 dark:text-gray-500">Started</p>
                <p className="text-gray-900 dark:text-gray-100">{formatDate(sub.startDate)}</p>
              </div>
              {sub.expiryDate && (
                <div>
                  <p className="text-gray-500 dark:text-gray-500">Ends</p>
                  <p className="text-gray-900 dark:text-gray-100">{formatDate(sub.expiryDate)}</p>
                </div>
              )}
              {sub.status !== 'CLOSED' && (
                <div>
                  <p className="text-gray-500 dark:text-gray-500">Next bill</p>
                  <p className="text-gray-900 dark:text-gray-100">{sub.status === 'PAUSED' ? 'Paused' : formatDate(sub.nextInvoiceDate)}</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {sub.allowedActions.length > 0 && (
          <Card>
            <CardBody className="flex flex-wrap gap-3">
              {sub.allowedActions.map((action) => (
                <Button
                  key={action}
                  variant={ACTIONS[action].destructive ? 'destructive' : 'primary'}
                  onClick={() => setConfirmAction(action)}
                >
                  {ACTIONS[action].label}
                </Button>
              ))}
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader title="Recent invoices" />
          <CardBody>
            {!invoices?.length ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">No invoices yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-gray-100 dark:divide-darkborder">
                {invoices.map((inv) => (
                  <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{inv.number}</p>
                      <p className="text-gray-500 dark:text-gray-500">Due {formatDate(inv.dueDate)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-900 dark:text-gray-100">{formatINR(inv.total)}</span>
                      <StatusBadge kind="invoice" status={inv.status} />
                      {inv.isOverdue && <OverdueBadge days={daysOverdue(inv.dueDate)} />}
                      <Link to={`/portal/invoices/${inv.id}/print`} className="text-primary-700 hover:underline dark:text-primary-300">
                        Download
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => mutation.mutate({ action: confirmAction })}
        title={confirmAction ? ACTIONS[confirmAction].title : ''}
        message={confirmAction ? ACTIONS[confirmAction].message : ''}
        confirmLabel={confirmAction ? ACTIONS[confirmAction].confirmLabel : ''}
        destructive={confirmAction ? ACTIONS[confirmAction].destructive : false}
        loading={mutation.isPending}
      />
    </div>
  );
}
