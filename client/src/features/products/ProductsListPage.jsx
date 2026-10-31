import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Card, DataTable, useListQuery, Button } from '../../components/ui';
import { formatINR } from '../../lib/format';
import { productsApi } from '../../api/catalog';
import { useAuth } from '../../app/AuthProvider';

const COLUMNS = [
  { key: 'name', header: 'Name', sortKey: 'name' },
  { key: 'type', header: 'Type', render: (r) => (r.type === 'SERVICE' ? 'Service' : 'Goods') },
  { key: 'salesPrice', header: 'Sales price', align: 'right', sortKey: 'salesPrice', render: (r) => formatINR(r.salesPrice) },
  { key: 'variantCount', header: 'Variants', align: 'right' },
  { key: 'isActive', header: 'Status', render: (r) => (r.isActive ? 'Active' : 'Archived') },
];

const FILTERS = [
  {
    key: 'type',
    label: 'Type',
    options: [
      { value: 'SERVICE', label: 'Service' },
      { value: 'GOODS', label: 'Goods' },
    ],
  },
  {
    key: 'isActive',
    label: 'Status',
    options: [{ value: 'false', label: 'Archived' }],
  },
];

export function ProductsListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN';
  const query = useListQuery(['type', 'isActive']);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products', query],
    queryFn: () => productsApi.list(query),
  });

  return (
    <div>
      <PageHeader
        title="Products"
        breadcrumb="Catalog"
        actions={canWrite && <Button variant="primary" onClick={() => navigate('/products/new')}>+ New product</Button>}
      />
      <Card>
        <div className="p-6">
          <DataTable
            columns={COLUMNS}
            data={data}
            isLoading={isLoading}
            error={error && "Couldn't load products."}
            onRetry={refetch}
            onRowClick={(row) => navigate(`/products/${row.id}`)}
            filters={FILTERS}
            searchPlaceholder="Search products…"
            emptyTitle="No products yet."
          />
        </div>
      </Card>
    </div>
  );
}
