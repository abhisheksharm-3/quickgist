/** Route table and the shared page frame. */
import { Link, Route, Routes } from 'react-router';
import { useSession } from '@/auth/use-session';
import { isAuthConfigured } from '@/lib/supabase-client';
import { CreateGistPage } from '@/pages/CreateGistPage';
import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ViewGistPage } from '@/pages/ViewGistPage';

export function App() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <SiteHeader />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/new" element={<CreateGistPage />} />
        <Route path="/g/:slug" element={<ViewGistPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

function SiteHeader() {
  const { user, isLoading, signInWithGitHub, signOut } = useSession();

  const handleSignIn = (): void => {
    void signInWithGitHub();
  };

  const handleSignOut = (): void => {
    void signOut();
  };

  return (
    <header className="mb-8 flex items-baseline justify-between gap-4 border-b pb-3">
      <Link to="/" className="font-semibold">
        quickgist
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        <Link to="/new" className="underline">
          new gist
        </Link>
        {isLoading || !isAuthConfigured ? null : user ? (
          <button type="button" onClick={handleSignOut} className="underline">
            sign out
          </button>
        ) : (
          <button type="button" onClick={handleSignIn} className="underline">
            sign in
          </button>
        )}
      </nav>
    </header>
  );
}
