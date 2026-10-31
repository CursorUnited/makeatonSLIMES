import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Card, DataTable, useListQuery, Button, StatusBadge } from '../../components/ui';
import { formatDate } from '../../lib/format';
import { api } from '../../api/client';
import { listSubscriptions } from '../../api/subscriptions';

const STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'QUOTATION', label: 'Quotation' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'CLOSED', label: 'Closed' },
];

const COLUMNS = [
  { key: 'number', header: 'Number', sortKey: 'number' },
  { key: 'customer', header: 'Customer', render: (r) => r.customer?.name ?? '—' },
  { key: 'plan', header: 'Plan', render: (r) => r.plan?.name ?? '—' },
  { key: 'startDate', header: 'Start', sortKey: 'startDate', render: (r) => formatDate(r.startDate) },
  { key: 'nextInvoiceDate', header: 'Next bill', sortKey: 'nextInvoiceDate', render: (r) => formatDate(r.nextInvoiceDate) },
  { key: 'status', header: 'Status', render: (r) => <StatusBadge kind="subscription" status={r.status} /> },
];

export function SubscriptionsListPage() {
  const navigate = useNavigate();
  const query = useListQuery(['status', 'planId']);

  const { data: plans } = useQuery({
    queryKey: ['plans-lookup'],
    queryFn: () => api.get('/plans', { params: { pageSize: 100 } }).then((r) => r.data.data),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscriptions', query],
    queryFn: () => listSubscriptions(query),
  });

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        actions={
          <Button variant="primary" onClick={() => navigate('/subscriptions/new')}>
            + New subscription
          </Button>
        }
      />
      <Card>
        <div className="p-6">
          <DataTable
            columns={COLUMNS}
            data={data}
            isLoading={isLoading}
            error={error && "Couldn't load subscriptions."}
            onRetry={refetch}
            onRowClick={(row) => navigate(`/subscriptions/${row.id}`)}
            searchPlaceholder="Search number or customer…"
            emptyTitle="No subscriptions yet."
            filters={[
              { key: 'status', label: 'Status', options: STATUS_OPTIONS },
              { key: 'planId', label: 'Plan', options: (plans ?? []).map((p) => ({ value: p.id, label: p.name })) },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}
