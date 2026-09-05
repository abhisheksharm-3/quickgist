/** The sign-in form's action: read the fields, sign in, go to your gists. */
import { useActionState } from 'react';
import { useNavigate } from 'react-router';
import { useSession } from '@/hooks/useSession';
import type { AuthFormResultType } from '@/types/auth';

/**
 * Returns the form action, its result, and whether it is in flight.
 *
 * Kept out of the page because it is the only part of signing in that is not
 * markup: reading FormData, calling the client, and turning a rejection into a
 * sentence somebody can act on.
 */
export function useSignInAction(): [AuthFormResultType, (formData: FormData) => void, boolean] {
  const navigate = useNavigate();
  const { signInWithPassword } = useSession();

  return useActionState<AuthFormResultType, FormData>(
    async (_previous, formData): Promise<AuthFormResultType> => {
      try {
        await signInWithPassword(
          String(formData.get('email') ?? '').trim(),
          String(formData.get('password') ?? ''),
        );
        navigate('/me');
        return { status: 'idle' };
      } catch (error) {
        return {
          status: 'error',
          message: error instanceof Error ? error.message : 'Those details did not work.',
        };
      }
    },
    { status: 'idle' },
  );
}
