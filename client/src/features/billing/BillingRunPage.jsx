import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageHeader, Card, CardHeader, CardBody, Button, DateInput, FormField, EmptyState, ErrorBanner, useToast } from '../../components/ui';
import { formatDate, formatDateTime } from '../../lib/format';
import { runBillingRun, listBillingRuns } from '../../api/billing';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function BillingRunPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [asOf, setAsOf] = useState(todayISO());
  const [asOfError, setAsOfError] = useState('');
  const [result, setResult] = useState(null);

  const runsQuery = useQuery({
    queryKey: ['billing-runs'],
    queryFn: listBillingRuns,
  });

  const runMutation = useMutation({
    mutationFn: () => runBillingRun(asOf),
    onSuccess: (data) => {
      setResult(data);
      setAsOfError('');
      toast(`Created ${data.createdCount} invoices, ${data.skippedCount} skipped, ${data.failedCount} failed`);
      queryClient.invalidateQueries({ queryKey: ['billing-runs'] });
    },
    onError: (err) => {
      if (err.fields?.asOf) setAsOfError(err.fields.asOf);
      else toast(err.message, 'danger');
    },
  });

  const maxDate = addDaysISO(todayISO(), 1);

  return (
    <div>
      <PageHeader title="Billing run" breadcrumb="Billing" />
      <Card>
        <CardBody>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Run the billing job to create invoices for every subscription due on or before the chosen date.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <FormField label="Bill everything due on or before" error={asOfError}>
              {(p) => (
                <DateInput
                  {...p}
                  value={asOf}
                  max={maxDate}
                  onChange={(e) => setAsOf(e.target.value)}
                  className="w-48"
                />
              )}
            </FormField>
            <Button variant="primary" loading={runMutation.isPending} onClick={() => runMutation.mutate()}>
              {runMutation.isPending ? 'Running…' : 'Run billing'}
            </Button>
          </div>

          {result && (
            <div className="mt-6 flex flex-col gap-1 rounded-md border border-success-700/30 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-300/20 dark:bg-success-700/15 dark:text-success-300">
              <p>
                Created {result.createdCount} invoice{result.createdCount === 1 ? '' : 's'}, {result.skippedCount} skipped,{' '}
                {result.failedCount} failed.
                {result.activatedCount > 0 &&
                  ` Activated ${result.activatedCount} subscription${result.activatedCount === 1 ? '' : 's'}.`}
                {result.closedCount > 0 && ` Closed ${result.closedCount}.`}
              </p>
              <Link to="/invoices?status=DRAFT" className="font-medium underline">
                View draft invoices
              </Link>
            </div>
          )}
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Recent runs" />
        <CardBody>
          {runsQuery.isLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-500">Loading…</p>
          ) : runsQuery.error ? (
            <ErrorBanner message="Couldn't load recent runs." onRetry={runsQuery.refetch} />
          ) : !runsQuery.data?.length ? (
            <EmptyState title="No billing runs yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-600 dark:border-darkborder dark:bg-darkbg dark:text-gray-400">
                    <th className="px-4 py-3 text-left">Started</th>
                    <th className="px-4 py-3 text-left">As of</th>
                    <th className="px-4 py-3 text-right">Created</th>
                    <th className="px-4 py-3 text-right">Skipped</th>
                    <th className="px-4 py-3 text-right">Failed</th>
                    <th className="px-4 py-3 text-left">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-darkborder">
                  {runsQuery.data.map((run) => (
                    <tr key={run.id} className="h-11">
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{formatDateTime(run.startedAt)}</td>
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{formatDate(run.asOf)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-gray-900 dark:text-gray-100">{run.createdCount}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-gray-900 dark:text-gray-100">{run.skippedCount}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-gray-900 dark:text-gray-100">{run.failedCount}</td>
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{run.triggeredBy?.name ?? 'Daily job'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
