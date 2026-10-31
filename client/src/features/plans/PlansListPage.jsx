import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Card, DataTable, useListQuery, Button } from '../../components/ui';
import { formatINR } from '../../lib/format';
import { plansApi } from '../../api/catalog';
import { useAuth } from '../../app/AuthProvider';

const PERIOD_LABEL = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly', YEARLY: 'Yearly' };

const COLUMNS = [
  { key: 'name', header: 'Name', sortKey: 'name' },
  { key: 'price', header: 'Price', align: 'right', render: (r) => formatINR(r.price) },
  { key: 'billingPeriod', header: 'Billing period', render: (r) => PERIOD_LABEL[r.billingPeriod] ?? r.billingPeriod },
  { key: 'minQuantity', header: 'Min. quantity', align: 'right' },
  { key: 'isActive', header: 'Status', render: (r) => (r.isActive ? 'Active' : 'Inactive') },
];

const FILTERS = [
  {
    key: 'billingPeriod',
    label: 'Billing period',
    options: Object.entries(PERIOD_LABEL).map(([value, label]) => ({ value, label })),
  },
  {
    key: 'isActive',
    label: 'Status',
    options: [
      { value: 'true', label: 'Active' },
      { value: 'false', label: 'Inactive' },
    ],
  },
];

export function PlansListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN';
  const query = useListQuery(['billingPeriod', 'isActive']);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['plans', query],
    queryFn: () => plansApi.list(query),
  });

  return (
    <div>
      <PageHeader
        title="Plans"
        breadcrumb="Catalog"
        actions={canWrite && <Button variant="primary" onClick={() => navigate('/plans/new')}>+ New plan</Button>}
      />
      <Card>
        <div className="p-6">
          <DataTable
            columns={COLUMNS}
            data={data}
            isLoading={isLoading}
            error={error && "Couldn't load plans."}
            onRetry={refetch}
            onRowClick={(row) => navigate(`/plans/${row.id}`)}
            filters={FILTERS}
            searchPlaceholder="Search plans…"
            emptyTitle="No plans yet."
          />
        </div>
      </Card>
    </div>
  );
}
