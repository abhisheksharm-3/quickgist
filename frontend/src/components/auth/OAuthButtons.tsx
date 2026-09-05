/** Buttons for whichever OAuth providers the project actually has enabled. */

import { useAuthCapabilities } from '@/api/useAuthCapabilities';
import { PROVIDER_LABELS } from '@/content/auth';
import { useSession } from '@/hooks/useSession';

/**
 * The OAuth options.
 *
 * The list comes from the project's own settings endpoint, not a hardcoded array,
 * because a button for a disabled provider sends people to a 400 from the authorize
 * endpoint. Turning GitHub on later makes it appear here with no code change.
 */
export function OAuthButtons() {
  const { signInWithOAuth } = useSession();
  const capabilities = useAuthCapabilities();
  const providers = capabilities.data?.oauthProviders ?? [];

  if (providers.length === 0) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {providers.map((provider) => (
          <button
            key={provider}
            type="button"
            onClick={() => void signInWithOAuth(provider)}
            className="border border-[var(--border-strong)] bg-[var(--panel-2)] px-3.5 py-2 text-[12.5px] text-[var(--text)] transition-colors hover:border-[var(--dim)] hover:text-[var(--heading)]"
          >
            Continue with {PROVIDER_LABELS[provider] ?? provider}
          </button>
        ))}
      </div>

      <p className="my-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.13em] text-[var(--faint)] uppercase">
        <span aria-hidden className="h-px flex-1 bg-[var(--border)]" />
        or
        <span aria-hidden className="h-px flex-1 bg-[var(--border)]" />
      </p>
    </>
  );
}
