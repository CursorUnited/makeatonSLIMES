import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { Button, ErrorBanner, Skeleton } from '../../components/ui';
import { formatINR, formatDate } from '../../lib/format';
import { getInvoice } from '../../api/portal';

export function PortalInvoicePrintPage() {
  const { id } = useParams();
  const { data: inv, isLoading, error, refetch } = useQuery({
    queryKey: ['portal-invoice-print', id],
    queryFn: () => getInvoice(id),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[210mm] p-10">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    );
  }

  if (error || !inv) {
    return (
      <div className="mx-auto max-w-[210mm] p-10">
        <ErrorBanner message="We couldn't find that invoice." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto flex max-w-[210mm] justify-end px-4 print:hidden">
        <Button variant="primary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden="true" />
          Print / Save as PDF
        </Button>
      </div>

      <div className="mx-auto mt-4 max-w-[210mm] bg-white p-10 shadow-sm print:mt-0 print:shadow-none">
        <div className="flex items-start justify-between border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{inv.company.name}</h1>
            <p className="whitespace-pre-line text-sm text-gray-600">{inv.company.address}</p>
            <p className="text-sm text-gray-600">{inv.company.email}</p>
            {inv.company.gstin && <p className="text-sm text-gray-600">GSTIN: {inv.company.gstin}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-lg font-semibold text-gray-900">Invoice {inv.number}</h2>
            <p className="text-sm text-gray-600">Date: {formatDate(inv.invoiceDate)}</p>
            <p className="text-sm text-gray-600">Due: {formatDate(inv.dueDate)}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Billed to</p>
            <p className="mt-1 font-medium text-gray-900">{inv.customer.name}</p>
            {inv.customer.company && <p className="text-sm text-gray-600">{inv.customer.company}</p>}
            {inv.customer.address && <p className="whitespace-pre-line text-sm text-gray-600">{inv.customer.address}</p>}
            <p className="text-sm text-gray-600">{inv.customer.email}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Subscription</p>
            <p className="mt-1 text-sm text-gray-900">
              {inv.subscription.number} · {inv.subscription.plan}
            </p>
            {(inv.periodStart || inv.periodEnd) && (
              <p className="text-sm text-gray-600">
                Period: {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}
              </p>
            )}
            {inv.paymentTerm && <p className="text-sm text-gray-600">Payment term: {inv.paymentTerm}</p>}
          </div>
        </div>

        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Unit price</th>
              <th className="py-2 text-right">Tax</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inv.lines.map((l) => (
              <tr key={l.id}>
                <td className="py-2 text-gray-900">{l.description}</td>
                <td className="py-2 text-right text-gray-900">{l.quantity}</td>
                <td className="py-2 text-right text-gray-900">{formatINR(l.unitPrice)}</td>
                <td className="py-2 text-right text-gray-900">{formatINR(l.taxAmount)}</td>
                <td className="py-2 text-right text-gray-900">{formatINR(l.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <div className="w-64 text-sm">
            <div className="flex justify-between py-1 text-gray-600">
              <span>Subtotal</span>
              <span>{formatINR(inv.untaxedAmount)}</span>
            </div>
            {Number(inv.discountAmount) > 0 && (
              <div className="flex justify-between py-1 text-gray-600">
                <span>Discount</span>
                <span>− {formatINR(inv.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between py-1 text-gray-600">
              <span>Tax</span>
              <span>{formatINR(inv.taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-300 py-2 text-base font-semibold text-gray-900">
              <span>Total</span>
              <span>{formatINR(inv.total)}</span>
            </div>
            <div className="flex justify-between py-1 text-gray-600">
              <span>Paid</span>
              <span>{formatINR(inv.amountPaid)}</span>
            </div>
            <div className="flex justify-between py-1 font-medium text-gray-900">
              <span>Amount due</span>
              <span>{formatINR(inv.amountDue)}</span>
            </div>
          </div>
        </div>

        <p className="mt-10 border-t border-gray-200 pt-6 text-center text-sm text-gray-500">Thank you for your business.</p>
      </div>
    </div>
  );
}
