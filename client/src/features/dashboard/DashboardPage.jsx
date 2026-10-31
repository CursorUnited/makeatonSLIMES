import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { AlertTriangle, Table as TableIcon } from 'lucide-react';
import { PageHeader, Card, CardHeader, CardBody, Select, DateInput, Skeleton, ErrorBanner, EmptyState } from '../../components/ui';
import { formatINR, formatDate, daysOverdue } from '../../lib/format';
import { api } from '../../api/client';

const STATUS_COLORS = {
  DRAFT: '#9CA3AF',
  QUOTATION: '#D97706',
  CONFIRMED: '#2563EB',
  ACTIVE: '#16A34A',
  PAUSED: '#D97706',
  CLOSED: '#4B5563',
};

function startOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

function KpiCard({ to, label, value, caption, tone }) {
  const body = (
    <Card className="p-5 transition-shadow hover:shadow-md">
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tabular-nums ${tone === 'danger' ? 'text-danger-700 dark:text-danger-300' : 'text-gray-900 dark:text-gray-100'}`}>
        {value}
      </p>
      {caption && <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">{caption}</p>}
    </Card>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function ChartCard({ title, isLoading, error, onRetry, children, table }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <Card>
      <CardHeader
        title={title}
        actions={
          !isLoading &&
          !error && (
            <button
              onClick={() => setShowTable((v) => !v)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <TableIcon className="h-3.5 w-3.5" />
              {showTable ? 'Show chart' : 'Show as table'}
            </button>
          )
        }
      />
      <CardBody>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : error ? (
          <ErrorBanner message={error} onRetry={onRetry} />
        ) : showTable ? (
          table
        ) : (
          children
        )}
      </CardBody>
    </Card>
  );
}

export function DashboardPage() {
  const [params, setParams] = useSearchParams();
  const from = params.get('from') ?? startOfMonth();
  const to = params.get('to') ?? today();
  const planId = params.get('planId') ?? '';
  const customerId = params.get('customerId') ?? '';

  function setParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const filters = { from, to, ...(planId && { planId }), ...(customerId && { customerId }) };

  const { data: plans } = useQuery({ queryKey: ['plans-all'], queryFn: () => api.get('/plans', { params: { pageSize: 100 } }).then((r) => r.data.data) });
  const { data: customers } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => api.get('/customers', { params: { pageSize: 100 } }).then((r) => r.data.data),
  });

  const summaryQ = useQuery({ queryKey: ['reports-summary', filters], queryFn: () => api.get('/reports/summary', { params: filters }).then((r) => r.data.data) });
  const revenueQ = useQuery({
    queryKey: ['reports-revenue', filters],
    queryFn: () => api.get('/reports/revenue-by-month', { params: { to, months: 12, ...(planId && { planId }), ...(customerId && { customerId }) } }).then((r) => r.data.data),
  });
  const overdueQ = useQuery({
    queryKey: ['reports-overdue', filters],
    queryFn: () => api.get('/reports/overdue-invoices', { params: { pageSize: 10, ...(planId && { planId }), ...(customerId && { customerId }) } }).then((r) => r.data.data),
  });

  const s = summaryQ.data;
  const statusData = s ? Object.entries(s.subscriptionsByStatus).map(([status, count]) => ({ status, count })) : [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DateInput aria-label="From" value={from} onChange={(e) => setParam('from', e.target.value)} />
            <span className="text-sm text-gray-500 dark:text-gray-500">to</span>
            <DateInput aria-label="To" value={to} onChange={(e) => setParam('to', e.target.value)} />
            <Select
              aria-label="Plan"
              placeholder="All plans"
              value={planId}
              onChange={(e) => setParam('planId', e.target.value)}
              options={(plans ?? []).map((p) => ({ value: p.id, label: p.name }))}
              className="w-auto min-w-[140px]"
            />
            <Select
              aria-label="Customer"
              placeholder="All customers"
              value={customerId}
              onChange={(e) => setParam('customerId', e.target.value)}
              options={(customers ?? []).map((c) => ({ value: c.id, label: c.name }))}
              className="w-auto min-w-[160px]"
            />
          </div>
        }
      />

      {summaryQ.isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : summaryQ.error ? (
        <ErrorBanner message="Couldn't load the summary." onRetry={summaryQ.refetch} />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          <KpiCard to={`/subscriptions?status=ACTIVE`} label="Active subscriptions" value={s.activeSubscriptions.toLocaleString('en-IN')} />
          <KpiCard label="MRR" value={formatINR(s.mrr)} caption="monthly equivalent" />
          <KpiCard label="Revenue" value={formatINR(s.revenueCollected)} caption="collected" />
          <KpiCard to="/invoices?status=CONFIRMED" label="Outstanding" value={formatINR(s.amountOutstanding)} caption="owed, not due" />
          <KpiCard
            to="/invoices?overdue=true"
            label="Overdue"
            value={`${s.overdueCount} · ${formatINR(s.overdueAmount)}`}
            caption="needs follow-up"
            tone="danger"
          />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Revenue by month"
          isLoading={revenueQ.isLoading}
          error={revenueQ.error && "Couldn't load revenue."}
          onRetry={revenueQ.refetch}
          table={
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-500">
                  <th className="py-1">Month</th>
                  <th className="py-1 text-right">Invoiced</th>
                  <th className="py-1 text-right">Collected</th>
                </tr>
              </thead>
              <tbody>
                {(revenueQ.data ?? []).map((r) => (
                  <tr key={r.month} className="border-t border-gray-100 dark:border-darkborder">
                    <td className="py-1">{r.month}</td>
                    <td className="py-1 text-right tabular-nums">{formatINR(r.invoiced)}</td>
                    <td className="py-1 text-right tabular-nums">{formatINR(r.collected)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <p className="sr-only">Monthly invoiced and collected revenue for the last 12 months.</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueQ.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-darkborder" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-gray-600 dark:fill-gray-400" />
              <YAxis tick={{ fontSize: 12 }} className="fill-gray-600 dark:fill-gray-400" tickFormatter={(v) => formatINR(v).replace('.00', '')} width={90} />
              <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ borderRadius: 8 }} />
              <Bar dataKey="invoiced" fill="#C9A8C0" name="Invoiced" radius={[4, 4, 0, 0]} />
              <Bar dataKey="collected" fill="#714B67" name="Collected" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Subscriptions by status"
          isLoading={summaryQ.isLoading}
          error={summaryQ.error && "Couldn't load statuses."}
          onRetry={summaryQ.refetch}
          table={
            <table className="w-full text-sm">
              <tbody>
                {statusData.map((r) => (
                  <tr key={r.status} className="border-t border-gray-100 dark:border-darkborder">
                    <td className="py-1">{r.status}</td>
                    <td className="py-1 text-right tabular-nums">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <p className="sr-only">Count of subscriptions by lifecycle status.</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="count" nameKey="status" innerRadius={60} outerRadius={95} paddingAngle={2}>
                {statusData.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
            {statusData.map((r) => (
              <span key={r.status} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[r.status] }} />
                {r.status.charAt(0) + r.status.slice(1).toLowerCase()} {r.count}
              </span>
            ))}
          </div>
        </ChartCard>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Overdue invoices"
          actions={
            <Link to="/invoices?overdue=true" className="text-sm text-primary-700 hover:underline dark:text-primary-300">
              View all
            </Link>
          }
        />
        <CardBody className="p-0">
          {overdueQ.isLoading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : overdueQ.error ? (
            <div className="p-6">
              <ErrorBanner message="Couldn't load overdue invoices." onRetry={overdueQ.refetch} />
            </div>
          ) : overdueQ.data.data.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="Nothing overdue right now." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600 dark:border-darkborder dark:bg-darkbg dark:text-gray-500">
                  <th className="px-4 py-2">Number</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Due date</th>
                  <th className="px-4 py-2 text-right">Days</th>
                  <th className="px-4 py-2 text-right">Amount due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-darkborder">
                {overdueQ.data.data.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">
                      <Link to={`/invoices/${row.id}`} className="hover:underline">
                        {row.number}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{row.customer.name}</td>
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{formatDate(row.dueDate)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-danger-700 dark:text-danger-300">{row.daysOverdue ?? daysOverdue(row.dueDate)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-900 dark:text-gray-100">{formatINR(row.amountDue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
