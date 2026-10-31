import { Link, useNavigate } from 'react-router-dom';
import { Check, X as XIcon } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { useAuth } from '../../app/AuthProvider';
import { useApiForm } from '../../lib/useApiForm';
import { signupSchema, PASSWORD_RULES } from '../../lib/validation/auth';
import { landingPathFor } from '../../lib/roles';
import { useToast } from '../../components/ui';
import { FormField, Input, PasswordInput, Button, LinkButton } from '../../components/ui';
import { api } from '../../api/client';

export function SignupPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    submitApi,
    formState: { errors, isSubmitting },
  } = useApiForm(signupSchema, { defaultValues: { name: '', company: '', phone: '', email: '', password: '', confirmPassword: '' } });

  const password = watch('password') ?? '';

  const onSubmit = async ({ confirmPassword, ...body }) => {
    try {
      await submitApi(() => api.post('/auth/signup', body));
      const me = await login(body.email, body.password);
      toast(`Welcome to Brightloop, ${me.name.split(' ')[0]}`);
      navigate(landingPathFor(me.role), { replace: true });
    } catch (err) {
      if (!err.fields) toast(err.message, 'danger');
    }
  };

  return (
    <AuthLayout title="Create your account">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <FormField label="Full name" error={errors.name?.message} required>
          {(p) => <Input {...p} {...register('name')} autoComplete="name" />}
        </FormField>
        <FormField label="Company" error={errors.company?.message} optional>
          {(p) => <Input {...p} {...register('company')} autoComplete="organization" />}
        </FormField>
        <FormField label="Email" error={errors.email?.message} required>
          {(p) => <Input {...p} type="email" {...register('email')} autoComplete="email" />}
        </FormField>
        <FormField label="Password" error={errors.password?.message} required>
          {(p) => <PasswordInput {...p} {...register('password')} autoComplete="new-password" />}
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
        <Button type="submit" variant="primary" loading={isSubmitting} className="mt-2 w-full">
          Create account
        </Button>
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-700 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
