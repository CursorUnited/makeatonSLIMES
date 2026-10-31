import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { PageHeader, Card, CardBody, FormField, Input, Textarea, Button, useToast } from '../../components/ui';
import { useAuth } from '../../app/AuthProvider';
import { useApiForm } from '../../lib/useApiForm';
import { updateCustomer } from '../../api/portal';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter a name.').max(100, 'Keep it under 100 characters.'),
  phone: z
    .string()
    .trim()
    .max(20, 'Keep it under 20 characters.')
    .regex(/^[0-9 +()-]*$/, 'Use digits, spaces and + ( ) - only.')
    .optional(),
  company: z.string().trim().max(120, 'Keep it under 120 characters.').optional(),
  address: z.string().trim().max(300, 'Keep it under 300 characters.').optional(),
});

export function PortalProfilePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(user.customer ?? {});

  const {
    register,
    handleSubmit,
    reset,
    submitApi,
    formState: { errors, isSubmitting },
  } = useApiForm(profileSchema, {
    defaultValues: {
      name: profile.name ?? '',
      phone: profile.phone ?? '',
      company: profile.company ?? '',
      address: profile.address ?? '',
    },
  });

  const onSubmit = async (body) => {
    try {
      const saved = await submitApi(() => updateCustomer(user.customerId, body));
      setProfile(saved);
      reset({ name: saved.name ?? '', phone: saved.phone ?? '', company: saved.company ?? '', address: saved.address ?? '' });
      toast('Saved');
    } catch (err) {
      if (!err.fields) toast(err.message, 'danger');
    }
  };

  return (
    <div>
      <PageHeader title="My profile" />
      <Card>
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex max-w-lg flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Email</span>
              <p className="text-sm text-gray-700 dark:text-gray-300">{profile.email}</p>
            </div>
            <FormField label="Name" error={errors.name?.message} required>
              {(p) => <Input {...p} {...register('name')} autoComplete="name" />}
            </FormField>
            <FormField label="Phone" error={errors.phone?.message} optional>
              {(p) => <Input {...p} {...register('phone')} autoComplete="tel" />}
            </FormField>
            <FormField label="Company" error={errors.company?.message} optional>
              {(p) => <Input {...p} {...register('company')} autoComplete="organization" />}
            </FormField>
            <FormField label="Address" error={errors.address?.message} optional>
              {(p) => <Textarea {...p} {...register('address')} />}
            </FormField>
            <div className="mt-2 flex items-center gap-4">
              <Button type="submit" variant="primary" loading={isSubmitting}>
                Save changes
              </Button>
              <Link to="/forgot-password" className="text-sm text-primary-700 hover:underline dark:text-primary-300">
                Change password
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
