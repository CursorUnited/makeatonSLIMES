import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader, Card, DataTable, useListQuery, StatusBadge, OverdueBadge } from '../../components/ui';
import { formatDate, formatINR, daysOverdue } from '../../lib/format';
import { listInvoices } from '../../api/portal';

const COLUMNS = [
  { key: 'number', header: 'Number' },
  { key: 'invoiceDate', header: 'Date', render: (r) => formatDate(r.invoiceDate) },
  { key: 'dueDate', header: 'Due date', render: (r) => formatDate(r.dueDate) },
  { key: 'total', header: 'Total', align: 'right', render: (r) => formatINR(r.total) },
  {
    key: 'status',
    header: 'Status',
    render: (r) => (
      <div className="flex items-center gap-2">
        <StatusBadge kind="invoice" status={r.status} />
        {r.isOverdue && <OverdueBadge days={daysOverdue(r.dueDate)} />}
      </div>
    ),
  },
  {
    key: 'download',
    header: '',
    render: (r) => (
      <Link to={`/portal/invoices/${r.id}/print`} className="text-primary-700 hover:underline">
        Download
      </Link>
    ),
  },
];

export function PortalInvoicesPage() {
  const query = useListQuery();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['portal-invoices', query],
    queryFn: () => listInvoices(query),
  });

  return (
    <div>
      <PageHeader title="My invoices" />
      <Card>
        <div className="p-6">
          <DataTable
            columns={COLUMNS}
            data={data}
            isLoading={isLoading}
            error={error && "Couldn't load your invoices."}
            onRetry={refetch}
            searchPlaceholder="Search invoices…"
            emptyTitle="You don't have any invoices yet."
          />
        </div>
      </Card>
    </div>
  );
}
