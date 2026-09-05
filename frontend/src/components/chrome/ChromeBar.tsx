/** The bar every route keeps on screen, even when the API underneath it is down. */
import { Menu, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { isAuthConfigured } from '@/api/supabase-client';
import { BrandMark } from '@/components/chrome/BrandMark';
import { KeyboardBadge } from '@/components/chrome/KeyboardBadge';
import { MobileNav } from '@/components/chrome/MobileNav';
import { ThemeToggle } from '@/components/chrome/ThemeToggle';
import { navLink, pill, primary } from '@/constants/chrome';
import { useSession } from '@/hooks/useSession';
import { cn } from '@/logic/cn';

/**
 * The application bar.
 *
 * On a narrow screen the navigation collapses behind a disclosure rather than
 * wrapping onto a second line, and the search control keeps its icon but drops its
 * label and keyboard badge, which a phone has no use for. New gist stays visible at
 * every width because it is the one thing someone arriving here wants.
 */
export function ChromeBar() {
  const { user, isLoading, signOut } = useSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isMenuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: '/explore', label: 'Explore' },
    ...(user ? [{ to: '/me', label: 'Your gists' }] : []),
    { to: '/about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-30 flex-none border-b border-[var(--border)] bg-[var(--panel)]/95 backdrop-blur">
      <div className="flex h-[var(--chrome-h)] items-center justify-between gap-3 px-4 sm:gap-6 sm:px-5">
        <div className="flex min-w-0 items-center gap-7">
          <Link
            to="/"
            className="flex flex-none items-center gap-2 text-[15px] font-semibold tracking-[-0.02em] text-[var(--heading)]"
          >
            <BrandMark />
            quickgist
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(navLink, pathname === link.to && 'text-[var(--heading)]')}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-none items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => navigate('/explore')}
            className={pill}
            aria-label="Search gists"
          >
            <Search className="size-3.5 sm:hidden" aria-hidden />
            <span className="hidden sm:inline">Search</span>
            <span className="hidden sm:inline">
              <KeyboardBadge>⌘K</KeyboardBadge>
            </span>
          </button>

          <span className="hidden md:block">
            <ThemeToggle />
          </span>

          <span aria-hidden className="hidden h-5 w-px bg-[var(--border)] sm:block" />

          {isLoading || !isAuthConfigured ? null : user ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className={cn(navLink, 'hidden sm:block')}
            >
              Sign out
            </button>
          ) : (
            <Link to="/sign-in" className={cn(navLink, 'hidden sm:block')}>
              Sign in
            </Link>
          )}

          <Link to="/" className={primary}>
            New<span className="hidden sm:inline"> gist</span>
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            className="grid size-[28px] flex-none place-items-center border border-[var(--border-strong)] bg-[var(--panel-2)] text-[var(--dim)] md:hidden"
          >
            {isMenuOpen ? (
              <X className="size-3.5" aria-hidden />
            ) : (
              <Menu className="size-3.5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      <MobileNav
        open={isMenuOpen}
        onClose={() => setMenuOpen(false)}
        links={[{ to: '/', label: 'New gist' }, ...links]}
        isAuthenticated={Boolean(user)}
        isAuthAvailable={isAuthConfigured}
        onSignOut={() => void signOut()}
      />
    </header>
  );
}
