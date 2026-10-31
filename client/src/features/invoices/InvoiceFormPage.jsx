import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { PageHeader, Card, CardHeader, CardBody, Button, StatusBadge, ConfirmDialog, EmptyState, ErrorBanner, Skeleton, Tag, useToast } from '../../components/ui';
import { formatDate, formatINR } from '../../lib/format';
import { getInvoice, confirmInvoice, cancelInvoice, sendInvoice } from '../../api/invoices';
import { PAYMENT_METHODS } from '../../api/payments';
import { RegisterPaymentModal } from './RegisterPaymentModal';

const STEPS = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PAID', label: 'Paid' },
];

function StatusSteps({ status }) {
  if (status === 'CANCELLED') return <StatusBadge kind="invoice" status="CANCELLED" />;
  const currentIndex = STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center">
          <span
            className={clsx(
              'rounded-full px-3 py-1 text-sm font-medium',
              i === currentIndex
                ? 'bg-primary-700 text-white'
                : i < currentIndex
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-700/15 dark:text-primary-300'
                  : 'bg-gray-100 text-gray-500 dark:bg-darksurface dark:text-gray-500',
            )}
          >
            {step.label}
          </span>
          {i < STEPS.length - 1 && <ChevronRight className="mx-1 h-4 w-4 text-gray-400" aria-hidden="true" />}
        </div>
      ))}
    </div>
  );
}

export function InvoiceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  const {
    data: invoice,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['invoice', id] });
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
  }

  const confirmMutation = useMutation({
    mutationFn: () => confirmInvoice(id),
    onSuccess: (res) => {
      toast('Invoice confirmed');
      (res.warnings ?? []).forEach((w) => toast(w, 'warning'));
      invalidate();
    },
    onError: (err) => toast(err.message, 'danger'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelInvoice(id),
    onSuccess: () => {
      toast('Invoice cancelled');
      setCancelOpen(false);
      invalidate();
    },
    onError: (err) => {
      toast(err.message, 'danger');
      setCancelOpen(false);
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => sendInvoice(id),
    onSuccess: () => {
      toast('Sent');
      invalidate();
    },
    onError: (err) => toast(err.message, 'danger'),
  });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Invoice" breadcrumb="Invoices" />
        <Card>
          <CardBody className="flex flex-col gap-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div>
        <PageHeader title="Invoice" breadcrumb="Invoices" />
        <Card>
          <CardBody>
            <ErrorBanner message="Couldn't load this invoice." onRetry={refetch} />
          </CardBody>
        </Card>
      </div>
    );
  }

  const allowed = invoice.allowedActions ?? [];

  return (
    <div>
      <PageHeader
        title={`Invoice ${invoice.number}`}
        breadcrumb="Invoices"
        actions={
          <>
            {allowed.includes('confirm') && (
              <Button variant="primary" loading={confirmMutation.isPending} onClick={() => confirmMutation.mutate()}>
                Confirm
              </Button>
            )}
            {invoice.status === 'CONFIRMED' && (
              <Button variant="primary" onClick={() => setPaymentOpen(true)}>
                Register payment
              </Button>
            )}
            {allowed.includes('send') && (
              <Button variant="secondary" loading={sendMutation.isPending} onClick={() => sendMutation.mutate()}>
                Send
              </Button>
            )}
            {allowed.includes('cancel') && (
              <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                Cancel
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate(`/invoices/${invoice.id}/print`)}>
              Print
            </Button>
          </>
        }
      />

      <div className="mb-6">
        <StatusSteps status={invoice.status} />
      </div>

      <Card>
        <CardBody>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500">From</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{invoice.company?.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.company?.address}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.company?.email}</p>
              {invoice.company?.gstin && <p className="text-sm text-gray-600 dark:text-gray-400">GSTIN {invoice.company.gstin}</p>}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500">Bill to</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{invoice.customer?.name}</p>
              {invoice.customer?.company && <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.customer.company}</p>}
              <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.customer?.email}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.customer?.address}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-gray-500 dark:text-gray-500">Invoice date</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(invoice.invoiceDate)}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-500">Due date</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(invoice.dueDate)}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-500">Period</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-500">Payment terms</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">{invoice.paymentTerm ?? '—'}</p>
            </div>
          </div>

          {invoice.subscription && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Subscription{' '}
              <Link to={`/subscriptions/${invoice.subscription.id}`} className="text-primary-700 hover:underline dark:text-primary-300">
                {invoice.subscription.number}
              </Link>
              {invoice.subscription.plan && <> · {invoice.subscription.plan}</>}
            </p>
          )}
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Line items" />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-600 dark:border-darkborder dark:bg-darkbg dark:text-gray-400">
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Unit price</th>
                  <th className="px-4 py-3 text-right">Discount</th>
                  <th className="px-4 py-3 text-left">Tax</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-darkborder">
                {invoice.lines?.map((line) => (
                  <tr key={line.id}>
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{line.description}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-900 dark:text-gray-100">{line.quantity}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-900 dark:text-gray-100">{formatINR(line.unitPrice)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-900 dark:text-gray-100">
                      {Number(line.discountAmount) > 0 ? formatINR(line.discountAmount) : '—'}
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                      {line.taxes?.length ? (
                        <span className="flex flex-wrap gap-1">
                          {line.taxes.map((t) => (
                            <Tag key={t.id ?? `${t.name}-${t.rate}`} label={`${t.name} ${t.rate}%`} />
                          ))}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-900 dark:text-gray-100">{formatINR(line.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invoice.discounts?.length > 0 && (
            <div className="mt-4 text-sm">
              <p className="font-medium text-gray-900 dark:text-gray-100">Discounts applied</p>
              <ul className="mt-1 list-disc pl-5 text-gray-600 dark:text-gray-400">
                {invoice.discounts.map((d) => (
                  <li key={d.id}>
                    {d.name} — {formatINR(d.amount)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Untaxed amount</span>
                <span className="tabular-nums text-gray-900 dark:text-gray-100">{formatINR(invoice.untaxedAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Discount</span>
                <span className="tabular-nums text-gray-900 dark:text-gray-100">{formatINR(invoice.discountAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tax</span>
                <span className="tabular-nums text-gray-900 dark:text-gray-100">{formatINR(invoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5 font-semibold text-gray-900 dark:border-darkborder dark:text-gray-100">
                <span>Total</span>
                <span className="tabular-nums">{formatINR(invoice.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Paid</span>
                <span className="tabular-nums text-gray-900 dark:text-gray-100">{formatINR(invoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-900 dark:text-gray-100">
                <span>Amount due</span>
                <span className="tabular-nums">{formatINR(invoice.amountDue)}</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Payments" />
        <CardBody>
          {invoice.payments?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-600 dark:border-darkborder dark:bg-darkbg dark:text-gray-400">
                    <th className="px-4 py-3 text-left">Number</th>
                    <th className="px-4 py-3 text-left">Method</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-darkborder">
                  {invoice.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{p.number}</td>
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                        <Tag label={PAYMENT_METHODS.find((m) => m.value === p.method)?.label ?? p.method} />
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-gray-900 dark:text-gray-100">{formatINR(p.amount)}</td>
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{formatDate(p.paymentDate)}</td>
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100">{p.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No payments recorded yet." />
          )}
        </CardBody>
      </Card>

      <RegisterPaymentModal
        open={paymentOpen}
        invoice={invoice}
        onClose={() => setPaymentOpen(false)}
        onRegistered={() => {
          setPaymentOpen(false);
          invalidate();
        }}
      />

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Cancel invoice?"
        message="This cancels the invoice. It can't be undone."
        destructive
        confirmLabel="Cancel invoice"
        loading={cancelMutation.isPending}
      />
    </div>
  );
}
