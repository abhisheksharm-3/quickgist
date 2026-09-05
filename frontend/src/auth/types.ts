/** Types for the sign-in and sign-up forms. */
import type { ReactNode } from 'react';
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

/** One labelled field in an account form. */
export type AuthFieldPropsType = {
  name: string;
  label: string;
  type?: string | undefined;
  hint?: string | undefined;
  error?: string | null | undefined;
  autoComplete?: string | undefined;
  required?: boolean | undefined;
  minLength?: number | undefined;
  value?: string | undefined;
  onChange?: ((value: string) => void) | undefined;
  prefix?: string | undefined;
};

export type AuthShellPropsType = {
  code: string;
  title: string;
  intro: string;
  children: ReactNode;
  footer: ReactNode;
};

export type SessionProviderPropsType = {
  children: ReactNode;
};

/** One reason an account is worth having, as the account pages list them. */
export type AuthBenefitType = {
  title: string;
  detail: string;
};
