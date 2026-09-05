/** The build-time environment, read in one place. */

/**
 * Where the API is.
 *
 * Empty in development, where Vite proxies /v1 to the Go process, and absolute in
 * production. Three modules used to read this variable separately, which is three
 * places to change and three chances to disagree about the fallback.
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '';

/** The Supabase project, or empty when authentication is not configured. */
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? '';

/** The publishable key. Public by design: it ships in the bundle. */
export const SUPABASE_PUBLISHABLE_KEY: string = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';

/** The browser Sentry project, or empty to disable reporting. */
export const SENTRY_DSN: string = import.meta.env.VITE_SENTRY_DSN ?? '';

/** The share of sessions traced, as a number rather than the string Vite hands over. */
export const SENTRY_TRACES_SAMPLE_RATE: number = Number(
  import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? '0.1',
);

/** Which build this is, as Sentry labels the events it receives. */
export const MODE: string = import.meta.env.MODE;

/** Whether authentication can work at all, which decides what the UI offers. */
export const IS_AUTH_CONFIGURED: boolean = SUPABASE_URL !== '' && SUPABASE_PUBLISHABLE_KEY !== '';
