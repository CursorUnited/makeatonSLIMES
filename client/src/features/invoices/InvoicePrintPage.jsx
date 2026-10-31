import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { Button } from '../../components/ui';
import { formatDate, formatINR } from '../../lib/format';
import { getInvoice } from '../../api/invoices';

export function InvoicePrintPage() {
  const { id } = useParams();
  const {
    data: invoice,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['invoice', id, 'print'],
    queryFn: () => getInvoice(id),
  });

  if (isLoading) {
    return <div className="p-10 text-center text-sm text-gray-500">Loading…</div>;
  }

  if (error || !invoice) {
    return <div className="p-10 text-center text-sm text-danger-700">Couldn't load this invoice.</div>;
  }

  const watermark = invoice.status === 'DRAFT' ? 'DRAFT' : invoice.status === 'CANCELLED' ? 'CANCELLED' : null;

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="mx-auto max-w-[210mm] print:p-0">
        <div className="flex justify-end p-4 print:hidden">
          <Button variant="primary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden="true" /> Print / Save as PDF
          </Button>
        </div>
        <div className="relative bg-white p-10 shadow-sm print:p-0 print:shadow-none">
          {watermark && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden" aria-hidden="true">
              <span className="-rotate-[30deg] select-none text-[8rem] font-bold uppercase text-gray-300 opacity-40">{watermark}</span>
            </div>
          )}

          <div className="relative">
            <div className="flex items-start justify-between border-b border-gray-200 pb-6">
              <div>
                <p className="text-xl font-semibold text-gray-900">{invoice.company?.name}</p>
                <p className="text-sm text-gray-600">{invoice.company?.address}</p>
                <p className="text-sm text-gray-600">{invoice.company?.email}</p>
                {invoice.company?.gstin && <p className="text-sm text-gray-600">GSTIN {invoice.company.gstin}</p>}
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-gray-900">Invoice</p>
                <p className="text-sm text-gray-600">{invoice.number}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Bill to</p>
                <p className="font-medium text-gray-900">{invoice.customer?.name}</p>
                {invoice.customer?.company && <p className="text-sm text-gray-600">{invoice.customer.company}</p>}
                <p className="text-sm text-gray-600">{invoice.customer?.email}</p>
                <p className="text-sm text-gray-600">{invoice.customer?.address}</p>
              </div>
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice date</span>
                  <span className="text-gray-900">{formatDate(invoice.invoiceDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Due date</span>
                  <span className="text-gray-900">{formatDate(invoice.dueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment terms</span>
                  <span className="text-gray-900">{invoice.paymentTerm ?? '—'}</span>
                </div>
                {invoice.subscription && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subscription</span>
                    <span className="text-gray-900">{invoice.subscription.number}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Period</span>
                  <span className="text-gray-900">
                    {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
                  </span>
                </div>
              </div>
            </div>

            <table className="mt-8 w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-300 text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-2 text-left">Description</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Unit price</th>
                  <th className="py-2 text-right">Discount</th>
                  <th className="py-2 text-right">Tax</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.lines?.map((line) => (
                  <tr key={line.id}>
                    <td className="py-2 text-gray-900">{line.description}</td>
                    <td className="py-2 text-right tabular-nums text-gray-900">{line.quantity}</td>
                    <td className="py-2 text-right tabular-nums text-gray-900">{formatINR(line.unitPrice)}</td>
                    <td className="py-2 text-right tabular-nums text-gray-900">
                      {Number(line.discountAmount) > 0 ? formatINR(line.discountAmount) : '—'}
                    </td>
                    <td className="py-2 text-right tabular-nums text-gray-900">{formatINR(line.taxAmount)}</td>
                    <td className="py-2 text-right tabular-nums text-gray-900">{formatINR(line.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {invoice.discounts?.length > 0 && (
              <div className="mt-4 text-sm text-gray-600">
                {invoice.discounts.map((d) => (
                  <div key={d.id} className="flex justify-between">
                    <span>{d.name}</span>
                    <span>− {formatINR(d.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Untaxed amount</span>
                  <span className="tabular-nums text-gray-900">{formatINR(invoice.untaxedAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount</span>
                  <span className="tabular-nums text-gray-900">{formatINR(invoice.discountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span className="tabular-nums text-gray-900">{formatINR(invoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-300 pt-1.5 text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span className="tabular-nums">{formatINR(invoice.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid</span>
                  <span className="tabular-nums text-gray-900">{formatINR(invoice.amountPaid)}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900">
                  <span>Amount due</span>
                  <span className="tabular-nums">{formatINR(invoice.amountDue)}</span>
                </div>
              </div>
            </div>

            <p className="mt-10 border-t border-gray-200 pt-6 text-center text-sm text-gray-500">Thank you for your business.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
