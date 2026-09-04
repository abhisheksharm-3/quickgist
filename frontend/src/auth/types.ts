/** Types for the sign-in and sign-up forms. */

export type AuthFormResultType =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'checkEmail'; email: string };

export type SignUpInputType = {
  email: string;
  password: string;
  handle: string;
  displayName: string;
};
