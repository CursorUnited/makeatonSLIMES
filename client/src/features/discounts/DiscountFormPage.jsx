import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Controller } from 'react-hook-form';
import { z } from 'zod';
import {
  PageHeader,
  Card,
  CardBody,
  CardHeader,
  Button,
  FormField,
  Input,
  MoneyInput,
  DateInput,
  Checkbox,
  Toggle,
  ErrorBanner,
  Skeleton,
  useToast,
} from '../../components/ui';
import { useApiForm } from '../../lib/useApiForm';
import { useAuth } from '../../app/AuthProvider';
import { api } from '../../api/client';
import { getDiscount, createDiscount, updateDiscount } from '../../api/discounts';

const discountSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name.').max(120, 'Keep it under 120 characters.'),
  type: z.enum(['PERCENT', 'FIXED']),
  value: z.string().min(1, 'Enter a value.'),
  scope: z.enum(['PRODUCT', 'SUBSCRIPTION']),
  minPurchase: z.string().optional(),
  minQuantity: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  usageLimit: z.string().optional(),
  isActive: z.boolean().optional(),
});

function RadioOption({ name, value, checked, onChange, label, disabled }) {
  return (
    <label className={'flex items-center gap-2 text-sm ' + (disabled ? 'opacity-50' : 'cursor-pointer')}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="h-4 w-4 border-gray-300 text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700"
      />
      {label}
    </label>
  );
}

function MultiPicker({ items, selectedIds, onToggle, labelFn, disabled }) {
  return (
    <div className="max-h-48 overflow-y-auto rounded-md border border-gray-300 p-2">
      {items.length === 0 ? (
        <p className="p-2 text-sm text-gray-500">None found.</p>
      ) : (
        items.map((item) => (
          <Checkbox
            key={item.id}
            label={labelFn(item)}
            checked={selectedIds.includes(item.id)}
            disabled={disabled}
            onChange={() => onToggle(item.id)}
          />
        ))
      )}
    </div>
  );
}

export function DiscountFormPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [productIds, setProductIds] = useState([]);
  const [subscriptionIds, setSubscriptionIds] = useState([]);
  const [applyToAllSubs, setApplyToAllSubs] = useState(true);

  const {
    data: discount,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['discount', id],
    queryFn: () => getDiscount(id),
    enabled: !isNew,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', 'picker'],
    queryFn: () => api.get('/products', { params: { pageSize: 100 } }).then((r) => r.data.data ?? r.data),
  });

  const { data: subscriptionsData } = useQuery({
    queryKey: ['subscriptions', 'picker'],
    queryFn: () => api.get('/subscriptions', { params: { pageSize: 100 } }).then((r) => r.data.data ?? r.data),
  });

  const products = productsData ?? [];
  const subscriptions = subscriptionsData ?? [];

  const {
    register,
    control,
    watch,
    reset,
    handleSubmit,
    submitApi,
    formState: { errors, isSubmitting },
  } = useApiForm(discountSchema, {
    defaultValues: {
      name: '',
      type: 'PERCENT',
      value: '',
      scope: 'PRODUCT',
      minPurchase: '0',
      minQuantity: '',
      startDate: '',
      endDate: '',
      usageLimit: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (discount) {
      reset({
        name: discount.name,
        type: discount.type,
        value: String(discount.value),
        scope: discount.scope,
        minPurchase: discount.minPurchase != null ? String(discount.minPurchase) : '0',
        minQuantity: discount.minQuantity != null ? String(discount.minQuantity) : '',
        startDate: discount.startDate ?? '',
        endDate: discount.endDate ?? '',
        usageLimit: discount.usageLimit != null ? String(discount.usageLimit) : '',
        isActive: discount.isActive,
      });
      setProductIds(discount.products?.map((p) => p.id) ?? []);
      setSubscriptionIds(discount.subscriptions?.map((s) => s.id) ?? []);
      setApplyToAllSubs((discount.subscriptions?.length ?? 0) === 0);
    }
  }, [discount, reset]);

  const type = watch('type');
  const scope = watch('scope');

  function toggleProduct(pid) {
    setProductIds((ids) => (ids.includes(pid) ? ids.filter((x) => x !== pid) : [...ids, pid]));
  }

  function toggleSubscription(sid) {
    setSubscriptionIds((ids) => (ids.includes(sid) ? ids.filter((x) => x !== sid) : [...ids, sid]));
  }

  const onSubmit = async (body) => {
    const payload = {
      name: body.name,
      type: body.type,
      value: body.value,
      scope: body.scope,
      minPurchase: body.minPurchase || '0',
      minQuantity: body.minQuantity ? Number(body.minQuantity) : undefined,
      startDate: body.startDate || undefined,
      endDate: body.endDate || undefined,
      usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
      isActive: body.isActive,
    };
    if (body.scope === 'PRODUCT') {
      payload.productIds = productIds;
      payload.subscriptionIds = [];
    } else {
      payload.subscriptionIds = applyToAllSubs ? [] : subscriptionIds;
      payload.productIds = [];
    }

    try {
      if (isNew) {
        await submitApi(() => createDiscount(payload));
        toast('Discount created');
      } else {
        await submitApi(() => updateDiscount(id, payload));
        toast('Discount updated');
      }
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      navigate('/discounts');
    } catch (err) {
      if (!err.fields) toast(err.message, 'danger');
    }
  };

  if (!isNew && isLoading) {
    return (
      <div>
        <PageHeader title="Discount" breadcrumb="Discounts" />
        <Card>
          <CardBody className="flex flex-col gap-3">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!isNew && (error || !discount)) {
    return (
      <div>
        <PageHeader title="Discount" breadcrumb="Discounts" />
        <Card>
          <CardBody>
            <ErrorBanner message="Couldn't load this discount." onRetry={refetch} />
          </CardBody>
        </Card>
      </div>
    );
  }

  const disabled = !isAdmin || isSubmitting;

  return (
    <div>
      <PageHeader
        title={isNew ? 'New discount' : discount.name}
        breadcrumb="Discounts"
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/discounts')}>
              Back
            </Button>
            {isAdmin && (
              <Button variant="primary" loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
                Save
              </Button>
            )}
          </>
        }
      />

      {!isAdmin && (
        <div className="mb-4 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Only admins can create or edit discounts. You're viewing this in read-only mode.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Details" />
          <CardBody className="flex flex-col gap-4">
            <FormField label="Name" error={errors.name?.message} required>
              {(p) => <Input {...p} {...register('name')} disabled={disabled} />}
            </FormField>

            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-600">Type</p>
              <div className="flex gap-6">
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <>
                      <RadioOption
                        name="type"
                        value="PERCENT"
                        checked={field.value === 'PERCENT'}
                        onChange={() => field.onChange('PERCENT')}
                        label="Percentage"
                        disabled={disabled}
                      />
                      <RadioOption
                        name="type"
                        value="FIXED"
                        checked={field.value === 'FIXED'}
                        onChange={() => field.onChange('FIXED')}
                        label="Fixed amount"
                        disabled={disabled}
                      />
                    </>
                  )}
                />
              </div>
            </div>

            <FormField label="Value" error={errors.value?.message} required>
              {(p) =>
                type === 'PERCENT' ? (
                  <div className="relative">
                    <Controller
                      control={control}
                      name="value"
                      render={({ field }) => (
                        <Input
                          {...p}
                          value={field.value}
                          onChange={field.onChange}
                          disabled={disabled}
                          inputMode="decimal"
                          className="pr-8 text-right tabular-nums"
                        />
                      )}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">%</span>
                  </div>
                ) : (
                  <Controller
                    control={control}
                    name="value"
                    render={({ field }) => <MoneyInput {...p} value={field.value} onChange={field.onChange} disabled={disabled} />}
                  />
                )
              }
            </FormField>

            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-600">Applies to</p>
              <div className="flex gap-6">
                <Controller
                  control={control}
                  name="scope"
                  render={({ field }) => (
                    <>
                      <RadioOption
                        name="scope"
                        value="PRODUCT"
                        checked={field.value === 'PRODUCT'}
                        onChange={() => field.onChange('PRODUCT')}
                        label="Specific products"
                        disabled={disabled}
                      />
                      <RadioOption
                        name="scope"
                        value="SUBSCRIPTION"
                        checked={field.value === 'SUBSCRIPTION'}
                        onChange={() => field.onChange('SUBSCRIPTION')}
                        label="Whole subscriptions"
                        disabled={disabled}
                      />
                    </>
                  )}
                />
              </div>
            </div>

            {scope === 'PRODUCT' ? (
              <div>
                <MultiPicker
                  items={products}
                  selectedIds={productIds}
                  onToggle={toggleProduct}
                  labelFn={(p) => p.name}
                  disabled={disabled}
                />
                {errors.productIds?.message && <p className="mt-1 text-xs text-danger-700">{errors.productIds.message}</p>}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Checkbox
                  label="Apply to all subscriptions"
                  checked={applyToAllSubs}
                  disabled={disabled}
                  onChange={() => setApplyToAllSubs((v) => !v)}
                />
                {!applyToAllSubs && (
                  <MultiPicker
                    items={subscriptions}
                    selectedIds={subscriptionIds}
                    onToggle={toggleSubscription}
                    labelFn={(s) => s.number}
                    disabled={disabled}
                  />
                )}
              </div>
            )}

            <p className="text-xs italic text-gray-500">
              Applies on its own to the next invoice that qualifies — it isn't combined with other discounts automatically.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Conditions" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Minimum quantity" hint="Leave empty for no minimum." error={errors.minQuantity?.message}>
              {(p) => <Input {...p} type="number" min="0" {...register('minQuantity')} disabled={disabled} />}
            </FormField>
            <FormField label="Minimum purchase" error={errors.minPurchase?.message}>
              {(p) => (
                <Controller
                  control={control}
                  name="minPurchase"
                  render={({ field }) => <MoneyInput {...p} value={field.value} onChange={field.onChange} disabled={disabled} />}
                />
              )}
            </FormField>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Validity" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Valid from" optional error={errors.startDate?.message}>
              {(p) => <DateInput {...p} {...register('startDate')} disabled={disabled} />}
            </FormField>
            <FormField label="Valid to" optional error={errors.endDate?.message}>
              {(p) => <DateInput {...p} {...register('endDate')} disabled={disabled} />}
            </FormField>
            <FormField label="Usage limit" hint="Leave empty for no limit." error={errors.usageLimit?.message}>
              {(p) => <Input {...p} type="number" min="1" {...register('usageLimit')} disabled={disabled} />}
            </FormField>
          </CardBody>
        </Card>

        {!isNew && discount?.usageLimit != null && (
          <Card>
            <CardBody>
              <p className="text-sm text-gray-600">
                Used {discount.usedCount} of {discount.usageLimit}
              </p>
              <div className="mt-1.5 h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-primary-700"
                  style={{ width: `${Math.min(100, (discount.usedCount / discount.usageLimit) * 100)}%` }}
                />
              </div>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Active</p>
              <p className="text-xs text-gray-500">Inactive discounts never apply, even if they're otherwise valid.</p>
            </div>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Toggle checked={field.value} onChange={field.onChange} label="Active" disabled={disabled} />
              )}
            />
          </CardBody>
        </Card>
      </form>
    </div>
  );
}
