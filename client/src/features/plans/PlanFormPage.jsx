import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  PageHeader,
  Card,
  CardBody,
  Button,
  FormField,
  Input,
  MoneyInput,
  Select,
  DateInput,
  Checkbox,
  useToast,
  Skeleton,
  ErrorBanner,
} from '../../components/ui';
import { formatINR } from '../../lib/format';
import { useApiForm } from '../../lib/useApiForm';
import { planSchema } from '../../lib/validation/catalog';
import { plansApi, taxesApi } from '../../api/catalog';
import { useAuth } from '../../app/AuthProvider';

const PERIOD_OPTIONS = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

export function PlanFormPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN';

  const { data: plan, isLoading, error, refetch } = useQuery({
    queryKey: ['plans', id],
    queryFn: () => plansApi.get(id),
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
  } = useApiForm(planSchema, {
    defaultValues: {
      name: '',
      price: '',
      billingPeriod: 'MONTHLY',
      taxIds: [],
      minQuantity: 1,
      startDate: '',
      endDate: '',
      autoClose: false,
      closable: true,
      pausable: false,
      renewable: true,
      isActive: true,
    },
    values: isNew
      ? undefined
      : plan
      ? {
          name: plan.name,
          price: String(plan.price ?? ''),
          billingPeriod: plan.billingPeriod,
          taxIds: (plan.taxes ?? []).map((t) => t.id),
          minQuantity: plan.minQuantity,
          startDate: plan.startDate ? plan.startDate.slice(0, 10) : '',
          endDate: plan.endDate ? plan.endDate.slice(0, 10) : '',
          autoClose: plan.autoClose,
          closable: plan.closable,
          pausable: plan.pausable,
          renewable: plan.renewable,
          isActive: plan.isActive,
        }
      : undefined,
  });

  const selectedTaxIds = watch('taxIds') ?? [];

  function toggleTax(taxId) {
    const next = selectedTaxIds.includes(taxId) ? selectedTaxIds.filter((t) => t !== taxId) : [...selectedTaxIds, taxId];
    setValue('taxIds', next, { shouldDirty: true });
  }

  const onSubmit = async (body) => {
    const payload = { ...body, minQuantity: Number(body.minQuantity), endDate: body.endDate || undefined };
    try {
      if (isNew) {
        const created = await submitApi(() => plansApi.create(payload));
        toast('Plan created');
        navigate(`/plans/${created.id}`, { replace: true });
      } else {
        await submitApi(() => plansApi.update(id, payload));
        toast('Plan saved');
        queryClient.invalidateQueries({ queryKey: ['plans', id] });
        queryClient.invalidateQueries({ queryKey: ['plans'] });
      }
    } catch (err) {
      if (!err.fields) toast(err.message, 'danger');
    }
  };

  if (!isNew && isLoading) {
    return (
      <div>
        <PageHeader title="Plan" breadcrumb="Catalog" />
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
        <PageHeader title="Plan" breadcrumb="Catalog" />
        <ErrorBanner message="Couldn't load this plan." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isNew ? 'New plan' : plan?.name}
        breadcrumb="Catalog / Plans"
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
            <FormField label="Name" error={errors.name?.message} required>
              {(p) => <Input {...p} disabled={!canWrite} {...register('name')} />}
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Price" hint="Billed as its own line each period." error={errors.price?.message} required>
                {(p) => (
                  <MoneyInput {...p} disabled={!canWrite} value={watch('price')} onChange={(v) => setValue('price', v, { shouldDirty: true })} />
                )}
              </FormField>
              <FormField label="Billing period" error={errors.billingPeriod?.message} required>
                {(p) => <Select {...p} disabled={!canWrite} options={PERIOD_OPTIONS} {...register('billingPeriod')} />}
              </FormField>
            </div>
            <FormField label="Base fee taxes" hint="Price = base fee billed as its own line.">
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
            <FormField label="Minimum quantity" error={errors.minQuantity?.message} required>
              {(p) => <Input {...p} type="number" min="1" step="1" disabled={!canWrite} {...register('minQuantity')} />}
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Available from" error={errors.startDate?.message} required>
                {(p) => <DateInput {...p} disabled={!canWrite} {...register('startDate')} />}
              </FormField>
              <FormField label="Available until" optional error={errors.endDate?.message}>
                {(p) => <DateInput {...p} disabled={!canWrite} {...register('endDate')} />}
              </FormField>
            </div>

            <div className="border-t border-gray-200 pt-4 dark:border-darkborder">
              <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Options</h2>
              <div className="flex flex-col gap-3">
                <Checkbox
                  label="Close automatically"
                  hint="Subscriptions close on their own at the expiry date."
                  disabled={!canWrite}
                  {...register('autoClose')}
                />
                <Checkbox
                  label="Closable"
                  hint="Can be closed early by staff or the customer."
                  disabled={!canWrite}
                  {...register('closable')}
                />
                <Checkbox label="Pausable" hint="Billing can be paused and resumed." disabled={!canWrite} {...register('pausable')} />
                <Checkbox label="Renewable" hint="Can be renewed for another term." disabled={!canWrite} {...register('renewable')} />
              </div>
            </div>
            <Checkbox label="Active" disabled={!canWrite} {...register('isActive')} />
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
