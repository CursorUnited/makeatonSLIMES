import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../app/ThemeProvider';

export function AuthLayout({ title, children }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-darkbg">
      <button
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="absolute right-4 top-4 rounded-md p-2 text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 dark:text-gray-400 dark:hover:bg-darkborder"
      >
        {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
      </button>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-700 text-lg font-semibold text-white">B</span>
          <p className="text-sm text-gray-600 dark:text-gray-400">Brightloop Software</p>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}
