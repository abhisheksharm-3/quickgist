/** Creating an account, at `/sign-up`. */
import { useActionState, useState } from 'react';
import { Link } from 'react-router';
import { AuthField } from '@/auth/AuthField';
import { AuthShell } from '@/auth/AuthShell';
import { handleError, suggestHandle } from '@/auth/handle-rules';
import { OAuthButtons } from '@/auth/OAuthButtons';
import type { AuthFormResultType } from '@/auth/types';
import { useSession } from '@/auth/use-session';
import { isAuthConfigured } from '@/lib/supabase-client';
import { useAuthCapabilities } from '@/lib/use-auth-capabilities';

const MIN_PASSWORD_LENGTH = 8;

/**
 * The sign-up page.
 *
 * It asks for a handle and a display name rather than deriving them, because
 * handle_new_user() otherwise falls back to the local part of the email address:
 * signing up as `a.sharma@work.example` would publish gists under `asharma`, which
 * nobody chose. The handle is validated here against the same pattern the database
 * enforces, so a bad one is caught before a round trip.
 *
 * It is a separate route from signing in. One form with two submit buttons made the
 * password field mean two different things, and gave a new account no way to say who
 * it belonged to.
 */
export function SignUpRoute() {
  const { signUpWithPassword } = useSession();
  const capabilities = useAuthCapabilities();

  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [handleTouched, setHandleTouched] = useState(false);

  const effectiveHandle = handleTouched ? handle : suggestHandle(displayName);
  const handleProblem = handleTouched ? handleError(effectiveHandle) : null;

  const [result, submit, isPending] = useActionState<AuthFormResultType, FormData>(
    async (_previous, formData): Promise<AuthFormResultType> => {
      const email = String(formData.get('email') ?? '').trim();
      const password = String(formData.get('password') ?? '');
      const confirm = String(formData.get('confirm') ?? '');
      const chosenHandle = String(formData.get('handle') ?? '').trim();
      const name = String(formData.get('displayName') ?? '').trim();

      const problem = handleError(chosenHandle);
      if (problem) {
        return { status: 'error', message: problem };
      }
      if (password !== confirm) {
        return { status: 'error', message: 'Those two passwords are not the same.' };
      }

      try {
        await signUpWithPassword(email, password, { handle: chosenHandle, displayName: name });
        return capabilities.data?.needsEmailConfirmation === false
          ? { status: 'idle' }
          : { status: 'checkEmail', email };
      } catch (error) {
        return {
          status: 'error',
          message: error instanceof Error ? error.message : 'That did not work.',
        };
      }
    },
    { status: 'idle' },
  );

  if (result.status === 'checkEmail') {
    return (
      <>
        <title>Confirm your email · quickgist</title>
        <meta name="robots" content="noindex" />

        <AuthShell
          code="Almost there"
          title="Check your email"
          intro={`We sent a confirmation link to ${result.email}. Open it and you are in.`}
          footer={
            <p>
              Already confirmed?{' '}
              <Link
                to="/sign-in"
                className="underline underline-offset-[3px] hover:text-[var(--heading)]"
              >
                Sign in
              </Link>
              .
            </p>
          }
        >
          <p className="text-[13px] leading-[1.7] text-[var(--dim)]">
            Nothing is lost if you close this tab. The link stays valid, and any gist you already
            made anonymously keeps working on its own.
          </p>
        </AuthShell>
      </>
    );
  }

  return (
    <>
      <title>Create an account · quickgist</title>
      <meta name="robots" content="noindex" />

      <AuthShell
        code="Account"
        title="Create an account"
        intro="An account is optional. It adds private gists, editing what you have published, and one page listing all of it."
        footer={
          <p>
            Already have one?{' '}
            <Link
              to="/sign-in"
              className="underline underline-offset-[3px] hover:text-[var(--heading)]"
            >
              Sign in
            </Link>
            .
          </p>
        }
      >
        {isAuthConfigured ? (
          <>
            <OAuthButtons />

            <form action={submit} className="flex flex-col gap-4">
              <AuthField
                name="displayName"
                label="Display name"
                autoComplete="name"
                hint="Shown on the gists you publish."
                value={displayName}
                onChange={setDisplayName}
              />

              <AuthField
                name="handle"
                label="Handle"
                prefix="/u/"
                autoComplete="username"
                hint="Lowercase letters, numbers and hyphens. This becomes your page address."
                error={handleProblem}
                value={effectiveHandle}
                onChange={(value) => {
                  setHandleTouched(true);
                  setHandle(value.toLowerCase());
                }}
              />

              <AuthField name="email" label="Email" type="email" autoComplete="email" />

              <AuthField
                name="password"
                label="Password"
                type="password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
              />

              <AuthField
                name="confirm"
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
              />

              {result.status === 'error' ? (
                <p className="border border-[var(--border-strong)] bg-[var(--panel-2)] px-3 py-2 text-[12.5px] text-[var(--body)]">
                  {result.message}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isPending || capabilities.data?.isSignupEnabled === false}
                className="mt-1 bg-[var(--blue-action)] px-3.5 py-2 text-[12.5px] font-medium text-white transition-colors hover:bg-[color-mix(in_oklab,var(--blue-action)_88%,black)] disabled:opacity-60"
              >
                {isPending ? 'Creating…' : 'Create account'}
              </button>

              {capabilities.data?.isSignupEnabled === false ? (
                <p className="text-[11.5px] text-[var(--faint)]">
                  New accounts are turned off for this deployment.
                </p>
              ) : null}
            </form>
          </>
        ) : (
          <p className="text-[13px] leading-[1.7] text-[var(--dim)]">
            Authentication is not configured for this deployment. Everything else works: you can
            create, read and search gists without an account.
          </p>
        )}
      </AuthShell>
    </>
  );
}
