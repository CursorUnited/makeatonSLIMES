import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Card, CardBody, StatusBadge, EmptyState, ErrorBanner, Skeleton, Button } from '../../components/ui';
import { formatINR, formatDate } from '../../lib/format';
import { listSubscriptions } from '../../api/portal';

const PERIOD_LABEL = { DAILY: 'day', WEEKLY: 'week', MONTHLY: 'month', YEARLY: 'year' };

export function PortalSubscriptionsPage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['portal-subscriptions'],
    queryFn: listSubscriptions,
  });

  return (
    <div>
      <PageHeader title="My subscriptions" />

      {error && <ErrorBanner message="Couldn't load your subscriptions." onRetry={refetch} />}

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardBody className="flex flex-col gap-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && !error && data?.length === 0 && (
        <EmptyState title="You don't have any subscriptions yet. Our team will send you a quotation." />
      )}

      {!isLoading && !error && data?.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((s) => {
            const period = PERIOD_LABEL[s.plan.billingPeriod] ?? s.plan.billingPeriod.toLowerCase();
            return (
              <Card key={s.id}>
                <CardBody className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-gray-900">{s.plan.name}</h3>
                    <StatusBadge kind="subscription" status={s.status} />
                  </div>
                  <p className="text-sm text-gray-600">
                    {period.charAt(0).toUpperCase() + period.slice(1)} plan · {formatINR(s.recurringTotal)} per {period}
                  </p>
                  {s.status === 'PAUSED' ? (
                    <p className="text-sm text-gray-600">Paused</p>
                  ) : (
                    s.nextInvoiceDate && <p className="text-sm text-gray-600">Next bill on {formatDate(s.nextInvoiceDate)}</p>
                  )}
                  {s.expiryDate && <p className="text-sm text-gray-600">Ends on {formatDate(s.expiryDate)}</p>}
                  <Button variant="secondary" className="mt-2 self-start" onClick={() => navigate(`/portal/subscriptions/${s.id}`)}>
                    View details
                  </Button>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
