import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { PageHeader, Card, CardBody, DataTable, useListQuery, Button, StatusBadge, OverdueBadge, Checkbox, PillFilter, useToast } from '../../components/ui';
import { formatDate, formatINR, daysOverdue } from '../../lib/format';
import { listInvoices, confirmInvoicesBulk } from '../../api/invoices';

const TABS = [
  { key: 'all', label: 'All', params: {} },
  { key: 'draft', label: 'Draft', params: { status: 'DRAFT' } },
  { key: 'confirmed', label: 'Confirmed/Unpaid', params: { status: 'CONFIRMED' } },
  { key: 'overdue', label: 'Overdue', params: { overdue: 'true' } },
  { key: 'paid', label: 'Paid', params: { status: 'PAID' } },
  { key: 'cancelled', label: 'Cancelled', params: { status: 'CANCELLED' } },
];

function activeTabKey(params) {
  if (params.get('overdue') === 'true') return 'overdue';
  const status = params.get('status');
  if (status === 'DRAFT') return 'draft';
  if (status === 'CONFIRMED') return 'confirmed';
  if (status === 'PAID') return 'paid';
  if (status === 'CANCELLED') return 'cancelled';
  return 'all';
}

export function InvoicesListPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const query = useListQuery(['status', 'overdue']);
  const activeTab = activeTabKey(params);
  const isDraftTab = activeTab === 'draft';
  const [selected, setSelected] = useState([]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['invoices', query],
    queryFn: () => listInvoices(query),
  });

  const rows = data?.data ?? [];

  function selectTab(tabKey) {
    const tab = TABS.find((t) => t.key === tabKey) ?? TABS[0];
    const next = new URLSearchParams();
    const q = params.get('q');
    if (q) next.set('q', q);
    Object.entries(tab.params).forEach(([k, v]) => next.set(k, v));
    setParams(next, { replace: true });
    setSelected([]);
  }

  function toggleRow(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  const bulkMutation = useMutation({
    mutationFn: () => confirmInvoicesBulk(selected),
    onSuccess: (res) => {
      const failedCount = res.failed?.length ?? 0;
      toast(
        `Confirmed ${res.confirmed.length} invoice${res.confirmed.length === 1 ? '' : 's'}${failedCount ? `, ${failedCount} failed` : ''}`,
        failedCount ? 'warning' : 'success',
      );
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err) => toast(err.message, 'danger'),
  });

  const columns = [
    ...(isDraftTab
      ? [
          {
            key: 'select',
            header:
              rows.length > 0 ? (
                <Checkbox
                  aria-label="Select all invoices on this page"
                  checked={rows.every((r) => selected.includes(r.id))}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() =>
                    setSelected((s) =>
                      rows.every((r) => s.includes(r.id)) ? s.filter((id) => !rows.some((r) => r.id === id)) : [...new Set([...s, ...rows.map((r) => r.id)])],
                    )
                  }
                />
              ) : (
                ''
              ),
            render: (r) => (
              <Checkbox
                aria-label={`Select invoice ${r.number}`}
                checked={selected.includes(r.id)}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggleRow(r.id)}
              />
            ),
          },
        ]
      : []),
    {
      key: 'number',
      header: 'Number',
      render: (r) => (
        <Link to={`/invoices/${r.id}`} className="text-primary-700 hover:underline dark:text-primary-300" onClick={(e) => e.stopPropagation()}>
          {r.number}
        </Link>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge kind="invoice" status={r.status} /> },
    { key: 'customer', header: 'Customer', render: (r) => r.customer?.name ?? '—' },
    { key: 'subscription', header: 'Subscription', render: (r) => r.subscription?.number ?? '—' },
    { key: 'invoiceDate', header: 'Invoice date', render: (r) => formatDate(r.invoiceDate) },
    {
      key: 'dueDate',
      header: 'Due date',
      render: (r) => (
        <span className="flex items-center gap-2">
          {formatDate(r.dueDate)}
          {r.isOverdue && <OverdueBadge days={daysOverdue(r.dueDate)} />}
        </span>
      ),
    },
    { key: 'total', header: 'Total', align: 'right', render: (r) => formatINR(r.total) },
    { key: 'amountDue', header: 'Amount due', align: 'right', render: (r) => formatINR(r.amountDue) },
  ];

  return (
    <div>
      <PageHeader title="Invoices" breadcrumb="Billing" />
      <div className="mb-4">
        <PillFilter options={TABS.map((tab) => ({ value: tab.key, label: tab.label }))} value={activeTab} onChange={selectTab} />
      </div>
      <Card>
        <CardBody>
          {isDraftTab && selected.length > 0 && (
            <div className="mb-4">
              <Button variant="primary" loading={bulkMutation.isPending} onClick={() => bulkMutation.mutate()}>
                Confirm selected ({selected.length})
              </Button>
            </div>
          )}
          <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            error={error && "Couldn't load invoices."}
            onRetry={refetch}
            onRowClick={(row) => navigate(`/invoices/${row.id}`)}
            searchPlaceholder="Search invoice number or customer…"
            emptyTitle="No invoices yet."
          />
        </CardBody>
      </Card>
    </div>
  );
}
