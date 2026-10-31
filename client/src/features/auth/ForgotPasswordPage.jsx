import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { useApiForm } from '../../lib/useApiForm';
import { forgotPasswordSchema } from '../../lib/validation/auth';
import { FormField, Input, Button } from '../../components/ui';
import { api } from '../../api/client';

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useApiForm(forgotPasswordSchema, { defaultValues: { email: '' } });

  const onSubmit = async ({ email }) => {
    await api.post('/auth/forgot-password', { email });
    setSent(true);
  };

  if (sent) {
    return (
      <AuthLayout title="Reset your password">
        <p className="text-center text-sm text-gray-700">
          If an account exists for that email, a reset link is on its way. It works for 30 minutes.
        </p>
        <Link to="/login" className="mt-6 block text-center text-sm text-primary-700 hover:underline">
          Back to log in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <p className="text-sm text-gray-600">Enter the email you signed up with.</p>
        <FormField label="Email" error={errors.email?.message} required>
          {(p) => <Input {...p} type="email" {...register('email')} autoComplete="email" autoFocus />}
        </FormField>
        <Button type="submit" variant="primary" loading={isSubmitting} className="w-full">
          Send reset link
        </Button>
        <Link to="/login" className="text-center text-sm text-primary-700 hover:underline">
          Back to log in
        </Link>
      </form>
    </AuthLayout>
  );
}
