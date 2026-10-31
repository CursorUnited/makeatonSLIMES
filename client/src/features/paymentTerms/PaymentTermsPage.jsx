import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader, Card, DataTable, useListQuery, Button, Modal, FormField, Input, useToast } from '../../components/ui';
import { useApiForm } from '../../lib/useApiForm';
import { paymentTermSchema } from '../../lib/validation/catalog';
import { paymentTermsApi } from '../../api/catalog';
import { useAuth } from '../../app/AuthProvider';

const COLUMNS = [
  { key: 'name', header: 'Name' },
  { key: 'dueDays', header: 'Due days', align: 'right' },
];

export function PaymentTermsPage() {
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN';
  const query = useListQuery();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['payment-terms', query],
    queryFn: () => paymentTermsApi.list(query),
  });

  return (
    <div>
      <PageHeader
        title="Payment terms"
        breadcrumb="Settings"
        actions={canWrite && <Button variant="primary" onClick={() => setAdding(true)}>+ Add payment term</Button>}
      />
      <Card>
        <div className="p-6">
          <DataTable
            columns={COLUMNS}
            data={data}
            isLoading={isLoading}
            error={error && "Couldn't load payment terms."}
            onRetry={refetch}
            searchPlaceholder="Search payment terms…"
            emptyTitle="No payment terms yet."
          />
        </div>
      </Card>
      {canWrite && (
        <AddPaymentTermModal
          open={adding}
          onClose={() => setAdding(false)}
          onCreated={() => {
            setAdding(false);
            queryClient.invalidateQueries({ queryKey: ['payment-terms'] });
          }}
        />
      )}
    </div>
  );
}

function AddPaymentTermModal({ open, onClose, onCreated }) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    submitApi,
    formState: { errors, isSubmitting },
  } = useApiForm(paymentTermSchema, { defaultValues: { name: '', dueDays: 30 } });

  const onSubmit = async (body) => {
    try {
      await submitApi(() => paymentTermsApi.create({ ...body, dueDays: Number(body.dueDays) }));
      toast('Payment term added');
      reset();
      onCreated();
    } catch (err) {
      if (!err.fields) toast(err.message, 'danger');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New payment term"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
            Add payment term
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <FormField label="Name" error={errors.name?.message} required>
          {(p) => <Input {...p} {...register('name')} />}
        </FormField>
        <FormField label="Due days" hint="Number of days after the invoice date that payment is due." error={errors.dueDays?.message} required>
          {(p) => <Input {...p} type="number" min="0" max="365" {...register('dueDays')} />}
        </FormField>
      </form>
    </Modal>
  );
}
