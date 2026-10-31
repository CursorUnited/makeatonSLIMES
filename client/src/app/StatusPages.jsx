import { Link } from 'react-router-dom';
import { ShieldAlert, SearchX } from 'lucide-react';
import { Button } from '../components/ui';
import { useAuth } from './AuthProvider';
import { landingPathFor } from '../lib/roles';

export function ForbiddenPage() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <ShieldAlert className="h-10 w-10 text-gray-400" aria-hidden="true" />
      <h1 className="text-xl font-semibold text-gray-900">You don't have access to this page.</h1>
      <Link to={user ? landingPathFor(user.role) : '/login'}>
        <Button variant="primary">{user ? 'Go to dashboard' : 'Log in'}</Button>
      </Link>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <SearchX className="h-10 w-10 text-gray-400" aria-hidden="true" />
      <h1 className="text-xl font-semibold text-gray-900">We couldn't find that page or record.</h1>
      <Link to="/">
        <Button variant="primary">Back</Button>
      </Link>
    </div>
  );
}
