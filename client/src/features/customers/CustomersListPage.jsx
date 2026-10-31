import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Card, DataTable, useListQuery, Button } from '../../components/ui';
import { customersApi } from '../../api/customers';

const COLUMNS = [
  { key: 'name', header: 'Name', sortKey: 'name' },
  { key: 'email', header: 'Email' },
  { key: 'company', header: 'Company', render: (r) => r.company || '—' },
  { key: 'activeSubscriptions', header: 'Active subscriptions', align: 'right' },
  { key: 'hasPortalUser', header: 'Portal access', render: (r) => (r.hasPortalUser ? 'Portal user' : '—') },
];

export function CustomersListPage() {
  const navigate = useNavigate();
  const query = useListQuery();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['customers', query],
    queryFn: () => customersApi.list(query),
  });

  return (
    <div>
      <PageHeader
        title="Customers"
        breadcrumb="Sales"
        actions={<Button variant="primary" onClick={() => navigate('/customers/new')}>+ New customer</Button>}
      />
      <Card>
        <div className="p-6">
          <DataTable
            columns={COLUMNS}
            data={data}
            isLoading={isLoading}
            error={error && "Couldn't load customers."}
            onRetry={refetch}
            onRowClick={(row) => navigate(`/customers/${row.id}`)}
            searchPlaceholder="Search name, email or company…"
            emptyTitle="No customers yet."
          />
        </div>
      </Card>
    </div>
  );
}
