/** The shapes of the shared layer: the HTTP client, the diff and the mutations. */

export type RequestOptionsType = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
};

export type AuthCapabilitiesType = {
  oauthProviders: string[];
  isEmailEnabled: boolean;
  isSignupEnabled: boolean;
  needsEmailConfirmation: boolean;
};

export type DiffKindType = 'same' | 'added' | 'removed';

export type DiffLineType = {
  kind: DiffKindType;
  text: string;
  oldLine: number | null;
  newLine: number | null;
};

export type RestoreVariablesType = {
  slug: string;
  revision: number;
};
