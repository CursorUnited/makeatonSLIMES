import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { Menu, X, LogOut, User as UserIcon, Sun, Moon, HelpCircle } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from './AuthProvider';
import { useTheme } from './ThemeProvider';
import { navForRole } from './nav';
import { TOURS } from './onboardingTours';
import { OnboardingTour } from '../components/ui';

function NavItems({ role, onNavigate }) {
  return navForRole(role).map((group, i) => (
    <div key={i} className="mb-4">
      {group.title && <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-500">{group.title}</p>}
      {group.items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          data-tour={`nav-${item.to}`}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-700/15 dark:text-primary-300'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-darkborder',
            )
          }
        >
          <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}
    </div>
  ));
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      data-tour="theme-toggle"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 dark:text-gray-400 dark:hover:bg-darkborder"
    >
      {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
    </button>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  const storageKey = user ? `onboarding-${user.role}` : null;
  const steps = user ? TOURS[user.role] : null;

  useEffect(() => {
    if (!storageKey) return;
    try {
      if (!localStorage.getItem(storageKey)) setTourOpen(true);
    } catch {
      // private window / blocked storage — skip auto-tour, replay still works from the help menu
    }
  }, [storageKey]);

  function finishTour() {
    setTourOpen(false);
    try {
      localStorage.setItem(storageKey, 'done');
    } catch {
      // per-viewer convenience only
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-darkbg">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-gray-200 bg-white p-3 md:flex dark:border-darkborder dark:bg-darksurface">
        <Link data-tour="brand" to="/" className="mb-6 flex items-center gap-2 px-3 py-2 text-base font-semibold text-gray-900 dark:text-gray-100">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-700 text-sm text-white">B</span>
          Brightloop
        </Link>
        <nav className="flex-1 overflow-y-auto">
          <NavItems role={user?.role} />
        </nav>
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-gray-900/40 dark:bg-black/60" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <aside className="relative z-10 flex h-full w-64 flex-col bg-white p-3 shadow-xl dark:bg-darksurface">
            <div className="mb-6 flex items-center justify-between px-3 py-2">
              <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Brightloop</span>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="rounded p-1 hover:bg-gray-100 dark:hover:bg-darkborder">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto">
              <NavItems role={user?.role} onNavigate={() => setDrawerOpen(false)} />
            </nav>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-darkborder dark:bg-darksurface">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded p-1.5 hover:bg-gray-100 md:hidden dark:hover:bg-darkborder"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => setTourOpen(true)}
              aria-label="Replay guided tour"
              className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 dark:text-gray-400 dark:hover:bg-darkborder"
            >
              <HelpCircle className="h-4.5 w-4.5" />
            </button>
            <div className="relative">
              <button
                data-tour="user-menu"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 dark:hover:bg-darkborder"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-50 text-primary-700 dark:bg-primary-700/15 dark:text-primary-300">
                  <UserIcon className="h-4 w-4" />
                </span>
                <span className="hidden text-gray-900 sm:inline dark:text-gray-100">{user?.name}</span>
                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-darkborder dark:text-gray-400">{user?.role}</span>
              </button>
              {menuOpen && (
                <div
                  className="absolute right-0 z-20 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-darkborder dark:bg-darksurface"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-darkborder"
                  >
                    <LogOut className="h-4 w-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      {steps && <OnboardingTour steps={steps} open={tourOpen} onFinish={finishTour} />}
    </div>
  );
}
