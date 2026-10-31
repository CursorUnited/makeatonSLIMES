import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFieldArray } from 'react-hook-form';
import { Trash2 } from 'lucide-react';
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  Button,
  FormField,
  Input,
  Select,
  Textarea,
  useToast,
  Skeleton,
  ErrorBanner,
} from '../../components/ui';
import { useApiForm } from '../../lib/useApiForm';
import { templateSchema } from '../../lib/validation/catalog';
import { templatesApi, plansApi, productsApi, paymentTermsApi } from '../../api/catalog';
import { useAuth } from '../../app/AuthProvider';

export function TemplateFormPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN';

  const { data: template, isLoading, error, refetch } = useQuery({
    queryKey: ['quotation-templates', id],
    queryFn: () => templatesApi.get(id),
    enabled: !isNew,
  });

  const { data: plansData } = useQuery({ queryKey: ['plans', 'picker'], queryFn: () => plansApi.list({ pageSize: 100 }) });
  const { data: productsData } = useQuery({ queryKey: ['products', 'picker'], queryFn: () => productsApi.list({ pageSize: 100 }) });
  const { data: termsData } = useQuery({ queryKey: ['payment-terms', 'picker'], queryFn: () => paymentTermsApi.list({ pageSize: 100 }) });

  const plans = plansData?.data ?? [];
  const products = productsData?.data ?? [];
  const terms = termsData?.data ?? [];

  const [variantsByProduct, setVariantsByProduct] = useState({});

  async function loadVariants(productId) {
    if (!productId || variantsByProduct[productId]) return;
    try {
      const detail = await productsApi.get(productId);
      setVariantsByProduct((m) => ({ ...m, [productId]: detail.variants ?? [] }));
    } catch {
      setVariantsByProduct((m) => ({ ...m, [productId]: [] }));
    }
  }

  const {
    register,
    handleSubmit,
    watch,
    control,
    submitApi,
    formState: { errors, isSubmitting },
  } = useApiForm(templateSchema, {
    defaultValues: {
      name: '',
      planId: '',
      validityDays: 30,
      paymentTermId: '',
      notes: '',
      lines: [],
    },
    values: isNew
      ? undefined
      : template
      ? {
          name: template.name,
          planId: template.plan?.id ?? '',
          validityDays: template.validityDays,
          paymentTermId: template.paymentTerm?.id ?? '',
          notes: template.notes ?? '',
          lines: (template.lines ?? []).map((l) => ({
            productId: l.product?.id ?? '',
            variantId: l.variant?.id ?? '',
            quantity: l.quantity,
            description: l.description ?? '',
          })),
        }
      : undefined,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const lines = watch('lines') ?? [];

  const onSubmit = async (body) => {
    const payload = {
      name: body.name,
      planId: body.planId,
      validityDays: Number(body.validityDays),
      paymentTermId: body.paymentTermId || undefined,
      notes: body.notes || undefined,
      lines: body.lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId || undefined,
        quantity: Number(l.quantity),
        description: l.description || undefined,
      })),
    };
    try {
      if (isNew) {
        const created = await submitApi(() => templatesApi.create(payload));
        toast('Quotation template created');
        navigate(`/templates/${created.id}`, { replace: true });
      } else {
        await submitApi(() => templatesApi.update(id, payload));
        toast('Quotation template saved');
        queryClient.invalidateQueries({ queryKey: ['quotation-templates', id] });
        queryClient.invalidateQueries({ queryKey: ['quotation-templates'] });
      }
    } catch (err) {
      if (!err.fields) toast(err.message, 'danger');
    }
  };

  if (!isNew && isLoading) {
    return (
      <div>
        <PageHeader title="Quotation template" breadcrumb="Catalog" />
        <Card>
          <CardBody>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="mt-4 h-10 w-full" />
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!isNew && error) {
    return (
      <div>
        <PageHeader title="Quotation template" breadcrumb="Catalog" />
        <ErrorBanner message="Couldn't load this template." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isNew ? 'New quotation template' : template?.name}
        breadcrumb="Catalog / Quotation templates"
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
              <FormField label="Plan" error={errors.planId?.message} required>
                {(p) => (
                  <Select {...p} disabled={!canWrite} placeholder="Choose a plan" options={plans.map((pl) => ({ value: pl.id, label: pl.name }))} {...register('planId')} />
                )}
              </FormField>
              <FormField label="Validity (days)" error={errors.validityDays?.message} required>
                {(p) => <Input {...p} type="number" min="1" max="365" disabled={!canWrite} {...register('validityDays')} />}
              </FormField>
              <FormField label="Payment term" optional error={errors.paymentTermId?.message}>
                {(p) => (
                  <Select
                    {...p}
                    disabled={!canWrite}
                    placeholder="No payment term"
                    options={terms.map((t) => ({ value: t.id, label: `${t.name} (${t.dueDays} days)` }))}
                    {...register('paymentTermId')}
                  />
                )}
              </FormField>
            </div>
            <FormField label="Notes" optional error={errors.notes?.message}>
              {(p) => <Textarea {...p} disabled={!canWrite} {...register('notes')} />}
            </FormField>
          </form>
        </CardBody>
      </Card>

      <Card className="mt-6">
        <CardHeader
          title="Lines"
          actions={canWrite && <Button variant="secondary" onClick={() => append({ productId: '', variantId: '', quantity: 1, description: '' })}>+ Add line</Button>}
        />
        <CardBody>
          {errors.lines?.message && <p className="mb-3 text-xs text-danger-700">{errors.lines.message}</p>}
          <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-darkborder">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-darkborder dark:bg-darkbg">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">Variant</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">Description</th>
                  {canWrite && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-darkborder">
                {fields.map((field, index) => {
                  const productId = lines[index]?.productId;
                  const variantOptions = variantsByProduct[productId] ?? [];
                  return (
                    <tr key={field.id}>
                      <td className="px-4 py-2">
                        <Select
                          disabled={!canWrite}
                          placeholder="Choose a product"
                          options={products.map((pr) => ({ value: pr.id, label: pr.name }))}
                          invalid={Boolean(errors.lines?.[index]?.productId)}
                          {...register(`lines.${index}.productId`)}
                          onChange={(e) => {
                            register(`lines.${index}.productId`).onChange(e);
                            loadVariants(e.target.value);
                          }}
                        />
                        {errors.lines?.[index]?.productId && (
                          <p className="mt-1 text-xs text-danger-700">{errors.lines[index].productId.message}</p>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <Select
                          disabled={!canWrite || variantOptions.length === 0}
                          placeholder={variantOptions.length ? 'No variant' : '—'}
                          options={variantOptions.map((v) => ({ value: v.id, label: v.label ?? `${v.attribute}: ${v.value}` }))}
                          {...register(`lines.${index}.variantId`)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          className="text-right"
                          disabled={!canWrite}
                          invalid={Boolean(errors.lines?.[index]?.quantity)}
                          {...register(`lines.${index}.quantity`)}
                        />
                        {errors.lines?.[index]?.quantity && (
                          <p className="mt-1 text-xs text-danger-700">{errors.lines[index].quantity.message}</p>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <Input disabled={!canWrite} {...register(`lines.${index}.description`)} />
                      </td>
                      {canWrite && (
                        <td className="px-4 py-2 text-right">
                          <button onClick={() => remove(index)} aria-label="Remove line" className="text-gray-500 hover:text-danger-700">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {fields.length === 0 && (
                  <tr>
                    <td colSpan={canWrite ? 5 : 4} className="px-4 py-6 text-center text-sm text-gray-500">
                      No lines yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
