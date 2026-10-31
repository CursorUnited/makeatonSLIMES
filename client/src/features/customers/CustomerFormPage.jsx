import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, Card, CardBody, Button, FormField, Input, Textarea, useToast, Skeleton, ErrorBanner } from '../../components/ui';
import { formatINR } from '../../lib/format';
import { useApiForm } from '../../lib/useApiForm';
import { customerSchema } from '../../lib/validation/catalog';
import { customersApi } from '../../api/customers';

export function CustomerFormPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: customer, isLoading, error, refetch } = useQuery({
    queryKey: ['customers', id],
    queryFn: () => customersApi.get(id),
    enabled: !isNew,
  });

  const {
    register,
    handleSubmit,
    submitApi,
    formState: { errors, isSubmitting },
  } = useApiForm(customerSchema, {
    defaultValues: { name: '', email: '', phone: '', company: '', address: '' },
    values: isNew
      ? undefined
      : customer
      ? {
          name: customer.name,
          email: customer.email,
          phone: customer.phone ?? '',
          company: customer.company ?? '',
          address: customer.address ?? '',
        }
      : undefined,
  });

  const onSubmit = async (body) => {
    try {
      if (isNew) {
        const created = await submitApi(() => customersApi.create(body));
        toast('Customer created');
        navigate(`/customers/${created.id}`, { replace: true });
      } else {
        await submitApi(() => customersApi.update(id, body));
        toast('Customer saved');
        queryClient.invalidateQueries({ queryKey: ['customers', id] });
        queryClient.invalidateQueries({ queryKey: ['customers'] });
      }
    } catch (err) {
      if (!err.fields) toast(err.message, 'danger');
    }
  };

  if (!isNew && isLoading) {
    return (
      <div>
        <PageHeader title="Customer" breadcrumb="Sales" />
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
        <PageHeader title="Customer" breadcrumb="Sales" />
        <ErrorBanner message="Couldn't load this customer." onRetry={refetch} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isNew ? 'New customer' : customer?.name}
        breadcrumb="Sales / Customers"
        actions={
          <Button variant="primary" loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
            Save
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Name" error={errors.name?.message} required>
                  {(p) => <Input {...p} {...register('name')} />}
                </FormField>
                <FormField label="Email" error={errors.email?.message} required>
                  {(p) => <Input {...p} type="email" {...register('email')} />}
                </FormField>
                <FormField label="Phone" optional error={errors.phone?.message}>
                  {(p) => <Input {...p} {...register('phone')} />}
                </FormField>
                <FormField label="Company" optional error={errors.company?.message}>
                  {(p) => <Input {...p} {...register('company')} />}
                </FormField>
              </div>
              <FormField label="Address" optional error={errors.address?.message}>
                {(p) => <Textarea {...p} {...register('address')} />}
              </FormField>
            </form>
          </CardBody>
        </Card>
        {!isNew && customer && (
          <Card>
            <CardBody>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Summary</h2>
              <dl className="flex flex-col gap-3 text-sm">
                <div>
                  <dt className="text-gray-500">Outstanding amount</dt>
                  <dd className="text-base font-medium text-gray-900">{formatINR(customer.outstandingAmount)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Subscriptions</dt>
                  <dd className="text-gray-900">
                    {Object.entries(customer.subscriptionCounts ?? {}).length === 0
                      ? 'None yet'
                      : Object.entries(customer.subscriptionCounts).map(([status, count]) => (
                          <span key={status} className="mr-3">
                            {status}: {count}
                          </span>
                        ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Portal access</dt>
                  <dd className="text-gray-900">{customer.hasPortalUser ? 'Has a portal account' : 'No portal account'}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
