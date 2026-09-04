/** The browser auth client. */
import { AuthClient } from '@supabase/auth-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Whether authentication is configured.
 *
 * A missing key disables sign-in rather than throwing at module load. The previous
 * app threw on a missing Clerk key, so one absent environment variable produced a
 * white screen with no rendering and no message.
 */
export const isAuthConfigured: boolean = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

/**
 * The auth client, or null when authentication is not configured.
 *
 * This is @supabase/auth-js rather than @supabase/supabase-js because auth is all
 * this app needs from Supabase in the browser. The full client also bundles the
 * postgrest, realtime, storage and functions clients, none of which are used:
 * gists go through the Go API, which checks a gist's visibility before touching
 * storage, and querying Postgres straight from the browser would route around that.
 */
export const auth = isAuthConfigured
  ? new AuthClient({
      url: `${SUPABASE_URL}/auth/v1`,
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'quickgist-auth',
      flowType: 'pkce',
    })
  : null;
