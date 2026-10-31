import { useQuery } from '@tanstack/react-query';
import { Trash2, Plus } from 'lucide-react';
import { Button, Select, Skeleton } from '../../components/ui';
import { formatINR } from '../../lib/format';
import { api } from '../../api/client';

function taxLabel(taxes) {
  if (!taxes?.length) return '—';
  return taxes.map((t) => t.name).join(', ');
}

function ReadOnlyRow({ line }) {
  return (
    <tr className="h-11 border-b border-gray-100">
      <td className="px-3 py-2">{line.product?.name ?? '—'}</td>
      <td className="px-3 py-2">{line.variant?.label ?? '—'}</td>
      <td className="px-3 py-2 text-right tabular-nums">{line.quantity}</td>
      <td className="px-3 py-2 text-right tabular-nums">{formatINR(line.unitPrice)}</td>
      <td className="px-3 py-2">{taxLabel(line.taxes)}</td>
      <td className="px-3 py-2 text-right tabular-nums font-medium">{formatINR(line.amount)}</td>
      <td className="px-3 py-2" />
    </tr>
  );
}

function EditableRow({ idx, line, products, computed, previewLoading, error, minQuantity, onChange, onRemove }) {
  const productId = line.productId ? Number(line.productId) : null;

  const { data: productDetail } = useQuery({
    queryKey: ['subscription-line-product', productId],
    queryFn: () => api.get(`/products/${productId}`).then((r) => r.data.data),
    enabled: productId != null,
    staleTime: 5 * 60 * 1000,
  });

  const variantOptions = (productDetail?.variants ?? []).map((v) => ({ value: v.id, label: v.label }));

  return (
    <tr className="border-b border-gray-100 align-top">
      <td className="px-3 py-2">
        <Select
          aria-label={`Product for line ${idx + 1}`}
          value={line.productId ?? ''}
          onChange={(e) => onChange({ ...line, productId: e.target.value, variantId: '' })}
          placeholder="Choose a product"
          options={products.map((p) => ({ value: p.id, label: p.name }))}
          className="min-w-[160px]"
        />
      </td>
      <td className="px-3 py-2">
        <Select
          aria-label={`Variant for line ${idx + 1}`}
          value={line.variantId ?? ''}
          onChange={(e) => onChange({ ...line, variantId: e.target.value })}
          placeholder="No variant"
          options={variantOptions}
          disabled={!productId || variantOptions.length === 0}
          className="min-w-[140px]"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          min={minQuantity ?? 1}
          aria-label={`Quantity for line ${idx + 1}`}
          value={line.quantity ?? ''}
          onChange={(e) => onChange({ ...line, quantity: e.target.value })}
          className={
            'h-10 w-20 rounded-md border bg-white px-2 text-right text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 ' +
            (error ? 'border-danger-700' : 'border-gray-300')
          }
        />
        {error && <p className="mt-1 text-xs text-danger-700">{error}</p>}
      </td>
      <td className="px-3 py-2 text-right tabular-nums text-gray-600">
        {previewLoading ? <Skeleton className="ml-auto h-4 w-16" /> : formatINR(computed?.unitPrice)}
      </td>
      <td className="px-3 py-2 text-gray-600">{previewLoading ? <Skeleton className="h-4 w-16" /> : taxLabel(computed?.taxes)}</td>
      <td className="px-3 py-2 text-right tabular-nums font-medium">
        {previewLoading ? <Skeleton className="ml-auto h-4 w-16" /> : formatINR(computed?.amount)}
      </td>
      <td className="px-3 py-2">
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove line ${idx + 1}`}
          className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-danger-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

const HEAD = ['Product', 'Variant', 'Qty', 'Unit price', 'Taxes', 'Amount', ''];

/**
 * `mode`: "readonly" (confirmed+), "template" (new sub, template chosen, no line overrides yet
 * — shows the template's computed lines with a "Customize lines" escape hatch), "editable".
 */
export function LinesEditor({ mode, lines, displayLines, computedLines, previewLoading, products, errors, minQuantity, onChange, onCustomize }) {
  function updateLine(idx, next) {
    onChange(lines.map((l, i) => (i === idx ? next : l)));
  }

  function removeLine(idx) {
    onChange(lines.filter((_, i) => i !== idx));
  }

  function addLine() {
    onChange([...lines, { productId: '', variantId: '', quantity: minQuantity ?? 1, description: '' }]);
  }

  if (mode === 'readonly') {
    return (
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-600">
              {HEAD.map((h) => (
                <th key={h} className="px-3 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(displayLines ?? []).map((l) => (
              <ReadOnlyRow key={l.id} line={l} />
            ))}
            {!displayLines?.length && (
              <tr>
                <td colSpan={HEAD.length} className="px-3 py-6 text-center text-sm text-gray-500">
                  No lines on this subscription.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  if (mode === 'template') {
    return (
      <div className="flex flex-col gap-3">
        <div className="overflow-x-auto rounded-md border border-gray-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-600">
                {HEAD.map((h) => (
                  <th key={h} className="px-3 py-2">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(displayLines ?? []).map((l, i) => (
                <ReadOnlyRow key={l.id ?? i} line={l} />
              ))}
              {!displayLines?.length && (
                <tr>
                  <td colSpan={HEAD.length} className="px-3 py-6 text-center text-sm text-gray-500">
                    {previewLoading ? 'Loading template lines…' : 'This template has no lines yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Button variant="secondary" className="self-start" onClick={onCustomize}>
          Customize lines
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-600">
              {HEAD.map((h) => (
                <th key={h} className="px-3 py-2">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => (
              <EditableRow
                key={idx}
                idx={idx}
                line={line}
                products={products}
                computed={computedLines?.[idx]}
                previewLoading={previewLoading}
                error={errors?.[`lines.${idx}.quantity`]}
                minQuantity={minQuantity}
                onChange={(next) => updateLine(idx, next)}
                onRemove={() => removeLine(idx)}
              />
            ))}
            {!lines.length && (
              <tr>
                <td colSpan={HEAD.length} className="px-3 py-6 text-center text-sm text-gray-500">
                  No lines yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Button variant="secondary" className="self-start" onClick={addLine}>
        <Plus className="h-4 w-4" /> Add a line
      </Button>
    </div>
  );
}
