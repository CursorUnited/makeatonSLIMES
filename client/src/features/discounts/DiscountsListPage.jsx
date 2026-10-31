import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageHeader, Card, CardBody, DataTable, useListQuery, Button, StatusBadge, Tag, PillFilter } from '../../components/ui';
import { formatINR } from '../../lib/format';
import { listDiscounts } from '../../api/discounts';
import { useAuth } from '../../app/AuthProvider';

const STATE_TABS = [
  { key: '', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'expired', label: 'Expired' },
  { key: 'exhausted', label: 'Used up' },
  { key: 'inactive', label: 'Inactive' },
];

export function DiscountsListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const query = useListQuery(['scope', 'status']);
  const activeState = params.get('status') ?? '';

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['discounts', query],
    queryFn: () => listDiscounts(query),
  });

  function selectState(key) {
    const next = new URLSearchParams(params);
    if (key) next.set('status', key);
    else next.delete('status');
    next.delete('page');
    setParams(next, { replace: true });
  }

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'value', header: 'Type / value', render: (r) => (r.type === 'PERCENT' ? `${r.value}%` : formatINR(r.value)) },
    { key: 'scope', header: 'Applies to', render: (r) => <Tag label={r.scope === 'PRODUCT' ? 'Products' : 'Subscriptions'} /> },
    { key: 'state', header: 'Status', render: (r) => <StatusBadge kind="discount" status={r.state} /> },
    {
      key: 'usage',
      header: 'Used',
      render: (r) => (r.usageLimit == null ? 'No limit' : `${r.usedCount} of ${r.usageLimit}`),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Discounts"
        breadcrumb="Billing"
        actions={
          user?.role === 'ADMIN' && (
            <Button variant="primary" onClick={() => navigate('/discounts/new')}>
              New discount
            </Button>
          )
        }
      />
      <div className="mb-4">
        <PillFilter options={STATE_TABS.map((tab) => ({ value: tab.key, label: tab.label }))} value={activeState} onChange={selectState} />
      </div>
      <Card>
        <CardBody>
          <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            error={error && "Couldn't load discounts."}
            onRetry={refetch}
            onRowClick={(row) => navigate(`/discounts/${row.id}`)}
            searchPlaceholder="Search discounts…"
            emptyTitle="No discounts yet."
          />
        </CardBody>
      </Card>
    </div>
  );
}
