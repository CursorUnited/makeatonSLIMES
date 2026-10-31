import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader, Card, DataTable, useListQuery, Button, Modal, FormField, Input, Select, Checkbox, useToast } from '../../components/ui';
import { useApiForm } from '../../lib/useApiForm';
import { taxSchema } from '../../lib/validation/catalog';
import { taxesApi } from '../../api/catalog';
import { useAuth } from '../../app/AuthProvider';

function formatRate(row) {
  return row.type === 'PERCENT' ? `${row.rate}%` : `₹ ${row.rate}`;
}

const COLUMNS = [
  { key: 'name', header: 'Name' },
  { key: 'type', header: 'Type', render: (r) => (r.type === 'PERCENT' ? 'Percentage' : 'Fixed') },
  { key: 'rate', header: 'Rate', render: formatRate, align: 'right' },
  { key: 'isActive', header: 'Active', render: (r) => (r.isActive ? 'Yes' : 'No') },
];

export function TaxesPage() {
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN';
  const query = useListQuery();
  const queryClient = useQueryClient();
  const [modalTax, setModalTax] = useState(null);
  const [adding, setAdding] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['taxes', query],
    queryFn: () => taxesApi.list(query),
  });

  return (
    <div>
      <PageHeader
        title="Taxes"
        breadcrumb="Settings"
        actions={canWrite && <Button variant="primary" onClick={() => setAdding(true)}>+ Add tax</Button>}
      />
      <Card>
        <div className="p-6">
          <DataTable
            columns={COLUMNS}
            data={data}
            isLoading={isLoading}
            error={error && "Couldn't load taxes."}
            onRetry={refetch}
            onRowClick={(row) => setModalTax(row)}
            searchPlaceholder="Search taxes…"
            emptyTitle="No taxes yet."
          />
        </div>
      </Card>
      <TaxFormModal
        open={adding}
        tax={null}
        readOnly={!canWrite}
        onClose={() => setAdding(false)}
        onSaved={() => {
          setAdding(false);
          queryClient.invalidateQueries({ queryKey: ['taxes'] });
        }}
      />
      <TaxFormModal
        open={Boolean(modalTax)}
        tax={modalTax}
        readOnly={!canWrite}
        onClose={() => setModalTax(null)}
        onSaved={() => {
          setModalTax(null);
          queryClient.invalidateQueries({ queryKey: ['taxes'] });
        }}
      />
    </div>
  );
}

function TaxFormModal({ open, tax, readOnly, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(tax);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    submitApi,
    formState: { errors, isSubmitting },
  } = useApiForm(taxSchema, {
    defaultValues: {
      name: tax?.name ?? '',
      type: tax?.type ?? 'PERCENT',
      rate: tax?.rate != null ? String(tax.rate) : '',
      isActive: tax?.isActive ?? true,
    },
    values: open
      ? {
          name: tax?.name ?? '',
          type: tax?.type ?? 'PERCENT',
          rate: tax?.rate != null ? String(tax.rate) : '',
          isActive: tax?.isActive ?? true,
        }
      : undefined,
  });

  const type = watch('type');

  const onSubmit = async (body) => {
    try {
      if (isEdit) await submitApi(() => taxesApi.update(tax.id, body));
      else await submitApi(() => taxesApi.create(body));
      toast(isEdit ? 'Tax updated' : 'Tax added');
      reset();
      onSaved();
    } catch (err) {
      if (!err.fields) toast(err.message, 'danger');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit tax' : 'New tax'}
      footer={
        !readOnly && (
          <>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
              Save
            </Button>
          </>
        )
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <FormField label="Name" error={errors.name?.message} required>
          {(p) => <Input {...p} disabled={readOnly} {...register('name')} />}
        </FormField>
        <FormField label="Type" error={errors.type?.message} required>
          {(p) => (
            <Select
              {...p}
              disabled={readOnly}
              options={[
                { value: 'PERCENT', label: 'Percentage' },
                { value: 'FIXED', label: 'Fixed' },
              ]}
              {...register('type')}
            />
          )}
        </FormField>
        <FormField label={type === 'FIXED' ? 'Rate (₹)' : 'Rate (%)'} error={errors.rate?.message} required>
          {(p) => <Input {...p} type="text" inputMode="decimal" disabled={readOnly} {...register('rate')} />}
        </FormField>
        <Checkbox label="Active" disabled={readOnly} {...register('isActive')} />
      </form>
    </Modal>
  );
}
