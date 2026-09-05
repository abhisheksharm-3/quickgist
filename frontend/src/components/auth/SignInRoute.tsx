/** Signing in, at `/sign-in`. */
import { Link } from 'react-router';
import { isAuthConfigured } from '@/api/supabase-client';
import { AuthField } from '@/components/auth/AuthField';
import { AuthShell } from '@/components/auth/AuthShell';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

import { useSignInAction } from '@/hooks/useSignInAction';

/**
 * The sign-in page.
 *
 * Signing in is optional throughout the product: creating, reading and searching all
 * work anonymously. An account adds private gists, editing, and a list of what you
 * have made, which is what this page says rather than implying you need one.
 */
export function SignInRoute() {
  const [result, submit, isPending] = useSignInAction();

  return (
    <>
      <title>Sign in · quickgist</title>
      <meta name="robots" content="noindex" />

      <AuthShell
        code="Account"
        title="Sign in"
        intro="You do not need an account to create or read a gist. Signing in adds private gists, editing, and a list of everything you have made."
        footer={
          <p>
            No account yet?{' '}
            <Link
              to="/sign-up"
              className="underline underline-offset-[3px] hover:text-[var(--heading)]"
            >
              Create one
            </Link>
            .
          </p>
        }
      >
        {isAuthConfigured ? (
          <>
            <OAuthButtons />

            <form action={submit} className="flex flex-col gap-4">
              <AuthField name="email" label="Email" type="email" autoComplete="email" />
              <AuthField
                name="password"
                label="Password"
                type="password"
                autoComplete="current-password"
              />

              {result.status === 'error' ? (
                <p className="border border-[var(--border-strong)] bg-[var(--panel-2)] px-3 py-2 text-[12.5px] text-[var(--body)]">
                  {result.message}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isPending}
                className="mt-1 bg-[var(--blue-action)] px-3.5 py-2 text-[12.5px] font-medium text-white transition-colors hover:bg-[color-mix(in_oklab,var(--blue-action)_88%,black)] disabled:opacity-60"
              >
                {isPending ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </>
        ) : (
          <p className="text-[13px] leading-[1.7] text-[var(--dim)]">
            Authentication is not configured for this deployment, so there is nothing to sign in to.
            Everything else works: you can create, read and search gists without an account.
          </p>
        )}
      </AuthShell>
    </>
  );
}
