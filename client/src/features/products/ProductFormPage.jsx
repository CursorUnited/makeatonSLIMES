import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Button,
  FormField,
  Input,
  MoneyInput,
  Select,
  Textarea,
  Checkbox,
  useToast,
  Skeleton,
  ErrorBanner,
  Tag,
} from '../../components/ui';
import { formatINR } from '../../lib/format';
import { useApiForm } from '../../lib/useApiForm';
import { productSchema, variantSchema } from '../../lib/validation/catalog';
import { productsApi, taxesApi } from '../../api/catalog';
import { useAuth } from '../../app/AuthProvider';

export function ProductFormPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN';

  const { data: product, isLoading, error, refetch } = useQuery({
    queryKey: ['products', id],
    queryFn: () => productsApi.get(id),
    enabled: !isNew,
  });

  const { data: taxesData } = useQuery({
    queryKey: ['taxes', 'picker'],
    queryFn: () => taxesApi.list({ pageSize: 100 }),
  });
  const taxOptions = taxesData?.data ?? [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    submitApi,
    formState: { errors, isSubmitting },
  } = useApiForm(productSchema, {
    defaultValues: { name: '', type: 'SERVICE', salesPrice: '', costPrice: '', notes: '', isActive: true, taxIds: [] },
    values: isNew
      ? undefined
      : product
      ? {
          name: product.name,
          type: product.type,
          salesPrice: String(product.salesPrice ?? ''),
          costPrice: String(product.costPrice ?? ''),
          notes: product.notes ?? '',
          isActive: product.isActive,
          taxIds: (product.taxes ?? []).map((t) => t.id),
        }
      : undefined,
  });

  const selectedTaxIds = watch('taxIds') ?? [];

  function toggleTax(taxId) {
    const next = selectedTaxIds.includes(taxId) ? selectedTaxIds.filter((t) => t !== taxId) : [...selectedTaxIds, taxId];
    setValue('taxIds', next, { shouldDirty: true });
  }

  const onSubmit = async (body) => {
    try {
      if (isNew) {
        const created = await submitApi(() => productsApi.create(body));
        toast('Product created');
        navigate(`/products/${created.id}`, { replace: true });
      } else {
        await submitApi(() => productsApi.update(id, body));
        toast('Product saved');
        queryClient.invalidateQueries({ queryKey: ['products', id] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      }
    } catch (err) {
      if (!err.fields) toast(err.message, 'danger');
    }
  };

  if (!isNew && isLoading) {
    return (
      <div>
        <PageHeader title="Product" breadcrumb="Catalog" />
        <Card>
          <CardBody>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="mt-4 h-10 w-full" />
            <Skeleton className="mt-4 h-10 w-full" />
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!isNew && error) {
    return (
      <div>
        <PageHeader title="Product" breadcrumb="Catalog" />
        <ErrorBanner message="Couldn't load this product." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isNew ? 'New product' : product?.name}
        breadcrumb="Catalog / Products"
        actions={
          canWrite && (
            <Button variant="primary" loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
              Save
            </Button>
          )
        }
      />
      <Card>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Name" error={errors.name?.message} required>
                {(p) => <Input {...p} disabled={!canWrite} {...register('name')} />}
              </FormField>
              <FormField label="Type" error={errors.type?.message} required>
                {(p) => (
                  <Select
                    {...p}
                    disabled={!canWrite}
                    options={[
                      { value: 'SERVICE', label: 'Service' },
                      { value: 'GOODS', label: 'Goods' },
                    ]}
                    {...register('type')}
                  />
                )}
              </FormField>
              <FormField label="Sales price" error={errors.salesPrice?.message} required>
                {(p) => (
                  <MoneyInput
                    {...p}
                    disabled={!canWrite}
                    value={watch('salesPrice')}
                    onChange={(v) => setValue('salesPrice', v, { shouldDirty: true })}
                  />
                )}
              </FormField>
              <FormField label="Cost price" error={errors.costPrice?.message} required>
                {(p) => (
                  <MoneyInput
                    {...p}
                    disabled={!canWrite}
                    value={watch('costPrice')}
                    onChange={(v) => setValue('costPrice', v, { shouldDirty: true })}
                  />
                )}
              </FormField>
            </div>
            <FormField label="Default taxes" hint="Applied to invoice lines for this product unless overridden.">
              {() => (
                <div className="flex flex-wrap gap-4">
                  {taxOptions.length === 0 && <p className="text-sm text-gray-500">No taxes set up yet.</p>}
                  {taxOptions.map((t) => (
                    <Checkbox
                      key={t.id}
                      label={`${t.name} (${t.type === 'PERCENT' ? `${t.rate}%` : formatINR(t.rate)})`}
                      checked={selectedTaxIds.includes(t.id)}
                      disabled={!canWrite}
                      onChange={() => toggleTax(t.id)}
                    />
                  ))}
                </div>
              )}
            </FormField>
            <FormField label="Notes" optional error={errors.notes?.message}>
              {(p) => <Textarea {...p} disabled={!canWrite} {...register('notes')} />}
            </FormField>
            <Checkbox label="Active" disabled={!canWrite} {...register('isActive')} />
          </form>
        </CardBody>
      </Card>

      {!isNew && product && <VariantsCard product={product} canWrite={canWrite} onChanged={refetch} />}
      {isNew && (
        <Card className="mt-6">
          <CardBody>
            <p className="text-sm text-gray-500">Save the product first to add variants.</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function VariantsCard({ product, canWrite, onChanged }) {
  const toast = useToast();
  const [editingId, setEditingId] = useState(null); // null | 'new' | variant.id
  const [draft, setDraft] = useState({ attribute: '', value: '', extraPrice: '' });
  const [rowErrors, setRowErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const variants = (product.variants ?? []).filter((v) => v.isActive !== false);

  function startAdd() {
    setEditingId('new');
    setDraft({ attribute: '', value: '', extraPrice: '' });
    setRowErrors({});
  }

  function startEdit(v) {
    setEditingId(v.id);
    setDraft({ attribute: v.attribute, value: v.value, extraPrice: String(v.extraPrice ?? '') });
    setRowErrors({});
  }

  function cancel() {
    setEditingId(null);
    setRowErrors({});
  }

  async function saveRow() {
    const parsed = variantSchema.safeParse(draft);
    if (!parsed.success) {
      const fieldErrors = {};
      for (const issue of parsed.error.issues) fieldErrors[issue.path[0]] = issue.message;
      setRowErrors(fieldErrors);
      return;
    }
    setSaving(true);
    try {
      if (editingId === 'new') {
        await productsApi.addVariant(product.id, parsed.data);
        toast('Variant added');
      } else {
        await productsApi.updateVariant(editingId, parsed.data);
        toast('Variant updated');
      }
      setEditingId(null);
      setRowErrors({});
      onChanged();
    } catch (err) {
      if (err.fields) setRowErrors(err.fields);
      else toast(err.message, 'danger');
    } finally {
      setSaving(false);
    }
  }

  async function archive(v) {
    try {
      await productsApi.updateVariant(v.id, { isActive: false });
      toast('Variant archived');
      onChanged();
    } catch (err) {
      toast(err.message, 'danger');
    }
  }

  function onRowKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveRow();
    } else if (e.key === 'Escape') {
      cancel();
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader
        title="Variants"
        actions={canWrite && editingId === null && <Button variant="secondary" onClick={startAdd}>+ Add variant</Button>}
      />
      <CardBody>
        <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-darkborder">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-darkborder dark:bg-darkbg">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">Attribute</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">Value</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">Extra price</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">Final price</th>
                {canWrite && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-darkborder">
              {variants.map((v) =>
                editingId === v.id ? (
                  <EditRow key={v.id} draft={draft} setDraft={setDraft} errors={rowErrors} onKeyDown={onRowKeyDown} />
                ) : (
                  <tr key={v.id} className="h-11">
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                      <Tag label={v.attribute} />
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                      <Tag label={v.value} />
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-900 dark:text-gray-100">{formatINR(v.extraPrice)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-gray-900 dark:text-gray-100">{formatINR(v.price)}</td>
                    {canWrite && (
                      <td className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => startEdit(v)}
                            disabled={editingId !== null}
                            aria-label={`Edit ${v.attribute}: ${v.value}`}
                            className="text-primary-700 hover:underline disabled:opacity-40"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => archive(v)}
                            disabled={editingId !== null}
                            className="text-sm text-gray-500 hover:text-danger-700 disabled:opacity-40"
                          >
                            Archive
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ),
              )}
              {editingId === 'new' && <EditRow draft={draft} setDraft={setDraft} errors={rowErrors} onKeyDown={onRowKeyDown} />}
              {variants.length === 0 && editingId === null && (
                <tr>
                  <td colSpan={canWrite ? 5 : 4} className="px-4 py-6 text-center text-sm text-gray-500">
                    No variants yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {editingId !== null && (
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="secondary" onClick={cancel} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} onClick={saveRow}>
              Save row
            </Button>
          </div>
        )}
        <p className="mt-3 text-xs text-gray-500">"Final price" = sales price + extra price (computed by the server).</p>
      </CardBody>
    </Card>
  );
}

function EditRow({ draft, setDraft, errors, onKeyDown }) {
  return (
    <tr className="bg-primary-50/40 dark:bg-primary-800/20" onKeyDown={onKeyDown}>
      <td className="px-4 py-2">
        <Input
          autoFocus
          value={draft.attribute}
          invalid={Boolean(errors.attribute)}
          onChange={(e) => setDraft({ ...draft, attribute: e.target.value })}
          placeholder="Brand"
        />
        {errors.attribute && <p className="mt-1 text-xs text-danger-700">{errors.attribute}</p>}
      </td>
      <td className="px-4 py-2">
        <Input
          value={draft.value}
          invalid={Boolean(errors.value)}
          onChange={(e) => setDraft({ ...draft, value: e.target.value })}
          placeholder="Odoo"
        />
        {errors.value && <p className="mt-1 text-xs text-danger-700">{errors.value}</p>}
      </td>
      <td className="px-4 py-2">
        <MoneyInput
          value={draft.extraPrice}
          invalid={Boolean(errors.extraPrice)}
          onChange={(v) => setDraft({ ...draft, extraPrice: v })}
        />
        {errors.extraPrice && <p className="mt-1 text-xs text-danger-700">{errors.extraPrice}</p>}
      </td>
      <td className="px-4 py-2 text-right text-gray-400">—</td>
      <td className="px-4 py-2" />
    </tr>
  );
}
