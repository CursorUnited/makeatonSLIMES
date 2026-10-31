import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader, Card, DataTable, useListQuery, Button, Modal, FormField, Input, PasswordInput, Toggle, useToast } from '../../components/ui';
import { formatDate } from '../../lib/format';
import { useApiForm } from '../../lib/useApiForm';
import { createStaffSchema } from '../../lib/validation/auth';
import { api } from '../../api/client';

const COLUMNS = (onToggle) => [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'createdAt', header: 'Added', render: (r) => formatDate(r.createdAt) },
  {
    key: 'isActive',
    header: 'Active',
    render: (r) => <Toggle checked={r.isActive} onChange={() => onToggle(r)} label={`${r.isActive ? 'Deactivate' : 'Activate'} ${r.name}`} />,
  },
];

export function UsersPage() {
  const query = useListQuery();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['users', query],
    queryFn: () => api.get('/users', { params: { ...query, role: 'STAFF' } }).then((r) => r.data),
  });

  async function toggleActive(row) {
    try {
      await api.patch(`/users/${row.id}`, { isActive: !row.isActive });
      toast(row.isActive ? 'Staff member deactivated' : 'Staff member activated');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err) {
      toast(err.message, 'danger');
    }
  }

  return (
    <div>
      <PageHeader title="Users" breadcrumb="Settings" actions={<Button variant="primary" onClick={() => setModalOpen(true)}>New staff member</Button>} />
      <Card>
        <div className="p-6">
          <DataTable
            columns={COLUMNS(toggleActive)}
            data={data}
            isLoading={isLoading}
            error={error && "Couldn't load users."}
            onRetry={refetch}
            searchPlaceholder="Search staff…"
            emptyTitle="No staff members yet."
          />
        </div>
      </Card>
      <NewStaffModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['users'] });
        }}
      />
    </div>
  );
}

function NewStaffModal({ open, onClose, onCreated }) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    submitApi,
    formState: { errors, isSubmitting },
  } = useApiForm(createStaffSchema, { defaultValues: { name: '', email: '', password: '' } });

  const onSubmit = async (body) => {
    try {
      await submitApi(() => api.post('/users', body));
      toast('Staff member added');
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
      title="New staff member"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
            Add staff member
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <FormField label="Name" error={errors.name?.message} required>
          {(p) => <Input {...p} {...register('name')} />}
        </FormField>
        <FormField label="Email" error={errors.email?.message} required>
          {(p) => <Input {...p} type="email" {...register('email')} />}
        </FormField>
        <FormField label="Temporary password" error={errors.password?.message} required>
          {(p) => <PasswordInput {...p} {...register('password')} />}
        </FormField>
      </form>
    </Modal>
  );
}
