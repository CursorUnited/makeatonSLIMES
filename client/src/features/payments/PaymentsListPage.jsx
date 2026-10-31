import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { PageHeader, Card, CardBody, DataTable, useListQuery, DateInput, Tag } from '../../components/ui';
import { formatDate, formatINR } from '../../lib/format';
import { listPayments, PAYMENT_METHODS } from '../../api/payments';

export function PaymentsListPage() {
  const [params, setParams] = useSearchParams();
  const query = useListQuery(['method', 'from', 'to', 'invoiceId', 'customerId']);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['payments', query],
    queryFn: () => listPayments(query),
  });

  function setDateParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next, { replace: true });
  }

  const columns = [
    { key: 'number', header: 'Number' },
    {
      key: 'invoice',
      header: 'Invoice',
      render: (r) => (
        <Link to={`/invoices/${r.invoice.id}`} className="text-primary-700 hover:underline dark:text-primary-300">
          {r.invoice.number}
        </Link>
      ),
    },
    { key: 'customer', header: 'Customer', render: (r) => r.customer?.name ?? '—' },
    {
      key: 'method',
      header: 'Method',
      render: (r) => <Tag label={PAYMENT_METHODS.find((m) => m.value === r.method)?.label ?? r.method} />,
    },
    { key: 'amount', header: 'Amount', align: 'right', render: (r) => formatINR(r.amount) },
    { key: 'paymentDate', header: 'Date', render: (r) => formatDate(r.paymentDate) },
    { key: 'note', header: 'Note', render: (r) => r.note || '—' },
  ];

  return (
    <div>
      <PageHeader title="Payments" breadcrumb="Billing" />
      <Card>
        <CardBody>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400">
              From
              <DateInput value={params.get('from') ?? ''} onChange={(e) => setDateParam('from', e.target.value)} className="w-40" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400">
              To
              <DateInput value={params.get('to') ?? ''} onChange={(e) => setDateParam('to', e.target.value)} className="w-40" />
            </label>
          </div>
          <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            error={error && "Couldn't load payments."}
            onRetry={refetch}
            filters={[{ key: 'method', label: 'Method', options: PAYMENT_METHODS }]}
            searchPlaceholder="Search payment number…"
            emptyTitle="No payments recorded yet."
          />
        </CardBody>
      </Card>
    </div>
  );
}
