import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, X as XIcon } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { useApiForm } from '../../lib/useApiForm';
import { resetPasswordSchema, PASSWORD_RULES } from '../../lib/validation/auth';
import { FormField, PasswordInput, Button, useToast } from '../../components/ui';
import { api } from '../../api/client';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const toast = useToast();
  const [invalid, setInvalid] = useState(false);
  const {
    register,
    watch,
    handleSubmit,
    submitApi,
    formState: { errors, isSubmitting },
  } = useApiForm(resetPasswordSchema, { defaultValues: { password: '', confirmPassword: '' } });

  const password = watch('password') ?? '';

  const onSubmit = async ({ password }) => {
    try {
      await submitApi(() => api.post('/auth/reset-password', { token, password }));
      toast('Password changed. Log in again.');
      navigate('/login', { replace: true });
    } catch (err) {
      if (err.code === 'AUTH_RESET_TOKEN_INVALID') setInvalid(true);
      else if (!err.fields) toast(err.message, 'danger');
    }
  };

  if (invalid) {
    return (
      <AuthLayout title="Choose a new password">
        <p className="text-center text-sm text-gray-700 dark:text-gray-300">This link has expired or was already used.</p>
        <Link to="/forgot-password" className="mt-6 block">
          <Button variant="primary" className="w-full">
            Send a new link
          </Button>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Choose a new password">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <FormField label="New password" error={errors.password?.message} required>
          {(p) => <PasswordInput {...p} {...register('password')} autoComplete="new-password" autoFocus />}
        </FormField>
        <ul aria-live="polite" className="flex flex-col gap-1">
          {PASSWORD_RULES.map((r) => {
            const pass = r.test(password);
            return (
              <li key={r.id} className={'flex items-center gap-1.5 text-xs ' + (pass ? 'text-success-700' : 'text-gray-500')}>
                {pass ? <Check className="h-3.5 w-3.5" /> : <XIcon className="h-3.5 w-3.5" />}
                {r.label}
              </li>
            );
          })}
        </ul>
        <FormField label="Confirm password" error={errors.confirmPassword?.message} required>
          {(p) => <PasswordInput {...p} {...register('confirmPassword')} autoComplete="new-password" />}
        </FormField>
        <Button type="submit" variant="primary" loading={isSubmitting} className="w-full">
          Save new password
        </Button>
      </form>
    </AuthLayout>
  );
}
