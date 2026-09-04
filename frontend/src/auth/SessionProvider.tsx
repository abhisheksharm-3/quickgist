/** Provides the Supabase session to the tree and keeps it current. */

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { SessionContext } from '@/auth/session-context';
import { auth } from '@/lib/supabase-client';
import type { SessionStateType, SessionUserType, SignUpProfileType } from '@/types';

type SessionProviderPropsType = {
  children: ReactNode;
};

/**
 * Tracks the signed-in user.
 *
 * When Supabase is not configured the provider settles immediately with no user,
 * so the app still renders and only sign-in is unavailable.
 */
export function SessionProvider({ children }: SessionProviderPropsType) {
  const [user, setUser] = useState<SessionUserType | null>(null);
  const [isLoading, setIsLoading] = useState(auth !== null);

  useEffect(() => {
    if (!auth) {
      return;
    }

    let isMounted = true;

    void auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }
      setUser(toSessionUser(data.session?.user));
      setIsLoading(false);
    });

    const { data } = auth.onAuthStateChange((_event, session) => {
      setUser(toSessionUser(session?.user));
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signInWithOAuth = useCallback(async (provider: string): Promise<void> => {
    if (!auth) {
      throw new Error('Authentication is not configured');
    }

    const { error } = await auth.signInWithOAuth({
      provider: provider as Parameters<typeof auth.signInWithOAuth>[0]['provider'],
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      throw error;
    }
  }, []);

  const signInWithPassword = useCallback(async (email: string, password: string): Promise<void> => {
    if (!auth) {
      throw new Error('Authentication is not configured');
    }

    const { error } = await auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
  }, []);

  const signUpWithPassword = useCallback(
    async (email: string, password: string, profile: SignUpProfileType): Promise<void> => {
      if (!auth) {
        throw new Error('Authentication is not configured');
      }

      // handle_new_user() reads user_name and full_name from this metadata, which is
      // how a password account gets the handle the person actually chose instead of
      // the local part of their email address.
      const { error } = await auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { user_name: profile.handle, full_name: profile.displayName },
        },
      });
      if (error) {
        throw error;
      }
    },
    [],
  );

  const signOut = useCallback(async (): Promise<void> => {
    setUser(null);

    if (!auth) {
      return;
    }

    // A local scope clears this browser's session without needing the server to
    // accept the token. A global sign-out fails outright when the token has already
    // expired, which left the button doing nothing at exactly the moment it mattered.
    await auth.signOut({ scope: 'local' });
  }, []);

  const value = useMemo<SessionStateType>(
    () => ({ user, isLoading, signInWithOAuth, signInWithPassword, signUpWithPassword, signOut }),
    [user, isLoading, signInWithOAuth, signInWithPassword, signUpWithPassword, signOut],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

function toSessionUser(
  user: { id: string; email?: string | undefined } | undefined,
): SessionUserType | null {
  if (!user) {
    return null;
  }
  return { id: user.id, email: user.email ?? null };
}
