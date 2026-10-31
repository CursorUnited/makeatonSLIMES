import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { useAuth } from '../../app/AuthProvider';
import { useApiForm } from '../../lib/useApiForm';
import { loginSchema } from '../../lib/validation/auth';
import { landingPathFor } from '../../lib/roles';
import { FormField, Input, PasswordInput, Button, ErrorBanner } from '../../components/ui';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [banner, setBanner] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useApiForm(loginSchema, { defaultValues: { email: '', password: '' } });

  const onSubmit = async ({ email, password }) => {
    setBanner('');
    try {
      const me = await login(email, password);
      const to = location.state?.from?.pathname ?? landingPathFor(me.role);
      navigate(to, { replace: true });
    } catch (err) {
      setBanner(err.code === 'AUTH_ACCOUNT_DISABLED' ? 'This account is inactive. Contact your administrator.' : 'Email or password is incorrect.');
    }
  };

  return (
    <AuthLayout title="Log in">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        {banner && <ErrorBanner message={banner} />}
        <FormField label="Email" error={errors.email?.message} required>
          {(p) => <Input {...p} type="email" {...register('email')} autoComplete="email" autoFocus />}
        </FormField>
        <div>
          <FormField label="Password" error={errors.password?.message} required>
            {(p) => <PasswordInput {...p} {...register('password')} autoComplete="current-password" />}
          </FormField>
          <div className="mt-1.5 text-right">
            <Link to="/forgot-password" className="text-sm text-primary-700 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" variant="primary" loading={isSubmitting} className="w-full">
          Log in
        </Button>
        <p className="text-center text-sm text-gray-600">
          New here?{' '}
          <Link to="/signup" className="text-primary-700 hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
