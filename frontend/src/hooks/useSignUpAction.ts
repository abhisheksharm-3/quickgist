/** The sign-up form's action: validate, create the account, decide what to say next. */
import { useActionState } from 'react';
import { useAuthCapabilities } from '@/api/useAuthCapabilities';
import { useSession } from '@/hooks/useSession';
import { handleError } from '@/logic/handle-rules';
import type { AuthFormResultType } from '@/types/auth';

/**
 * Returns the form action, its result, and whether it is in flight.
 *
 * The handle and the password confirmation are checked here rather than by the
 * fields, because both are answers about the form as a whole: whether two fields
 * agree, and whether a handle the database will judge is worth sending at all.
 *
 * What follows a successful sign-up depends on the project's settings: with email
 * confirmation off the session already exists, and telling somebody to check their
 * inbox for a message nobody sent is the worst possible ending.
 */
export function useSignUpAction(): [AuthFormResultType, (formData: FormData) => void, boolean] {
  const { signUpWithPassword } = useSession();
  const capabilities = useAuthCapabilities();

  return useActionState<AuthFormResultType, FormData>(
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
}
