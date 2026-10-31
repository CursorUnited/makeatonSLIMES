import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Card, DataTable, useListQuery, Button } from '../../components/ui';
import { plansApi, templatesApi } from '../../api/catalog';
import { useAuth } from '../../app/AuthProvider';

const COLUMNS = [
  { key: 'name', header: 'Name', sortKey: 'name' },
  { key: 'plan', header: 'Plan', render: (r) => r.plan?.name ?? '—' },
  { key: 'validityDays', header: 'Validity (days)', align: 'right' },
  { key: 'lineCount', header: 'Lines', align: 'right' },
];

export function TemplatesListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN';
  const query = useListQuery(['planId']);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['quotation-templates', query],
    queryFn: () => templatesApi.list(query),
  });

  const { data: plansData } = useQuery({
    queryKey: ['plans', 'picker'],
    queryFn: () => plansApi.list({ pageSize: 100 }),
  });
  const filters = [
    {
      key: 'planId',
      label: 'Plan',
      options: (plansData?.data ?? []).map((p) => ({ value: p.id, label: p.name })),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Quotation templates"
        breadcrumb="Catalog"
        actions={canWrite && <Button variant="primary" onClick={() => navigate('/templates/new')}>+ New template</Button>}
      />
      <Card>
        <div className="p-6">
          <DataTable
            columns={COLUMNS}
            data={data}
            isLoading={isLoading}
            error={error && "Couldn't load quotation templates."}
            onRetry={refetch}
            onRowClick={(row) => navigate(`/templates/${row.id}`)}
            filters={filters}
            searchPlaceholder="Search templates…"
            emptyTitle="No quotation templates yet."
          />
        </div>
      </Card>
    </div>
  );
}
