import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { landingPathFor } from '../lib/roles';

/** Blocks a route unless the user is logged in and (if given) has one of `roles`. */
export function RequireRole({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/403" replace />;
  return <Outlet />;
}

/** Keeps a logged-in user off public auth pages, sending them to their landing page. */
export function RedirectIfAuthed({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={landingPathFor(user.role)} replace />;
  return children;
}
