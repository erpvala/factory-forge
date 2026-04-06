import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ShellLink = {
  label: string;
  to: string;
};

type RoleDashboardShellProps = {
  title: string;
  subtitle: string;
  links: ShellLink[];
  children: ReactNode;
};

export default function RoleDashboardShell({ title, subtitle, links, children }: RoleDashboardShellProps) {
  const location = useLocation();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDark(isDark);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const next = !root.classList.contains('dark');
    root.classList.toggle('dark', next);
    try {
      localStorage.setItem('ui-theme', next ? 'dark' : 'light');
    } catch {
      // Ignore storage errors.
    }
    setDark(next);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col lg:flex-row">
        <aside className="w-full border-b border-slate-800 bg-slate-900/80 p-4 lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:border-b-0 lg:border-r lg:p-6">
          <div className="mb-5">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-xl font-semibold text-slate-100">{title}</h1>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-9 w-9 border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                onClick={toggleTheme}
                aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          </div>
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {links.map((link) => {
              const active = location.pathname === link.to || location.pathname.startsWith(`${link.to}/`);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? 'bg-[#2c6bed] text-white'
                      : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-3 md:p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
