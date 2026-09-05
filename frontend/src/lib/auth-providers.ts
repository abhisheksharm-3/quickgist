/** Discovering which sign-in methods the Supabase project actually has enabled. */
import { z } from 'zod';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/env';
import type { AuthCapabilitiesType } from '@/lib/types';

const SettingsSchema = z.object({
  external: z.record(z.string(), z.boolean()).default({}),
  disable_signup: z.boolean().default(false),
  mailer_autoconfirm: z.boolean().default(false),
});

/**
 * Asks the project which sign-in methods work.
 *
 * Rendering a GitHub button when the provider is disabled sends people to a 400 from
 * the authorize endpoint, so the buttons are derived from this rather than hardcoded.
 * The endpoint is public and needs only the publishable key.
 */
export async function fetchAuthCapabilities(): Promise<AuthCapabilitiesType> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
  });

  if (!response.ok) {
    throw new Error(`Auth settings returned ${response.status}`);
  }

  const settings = SettingsSchema.parse(await response.json());

  return {
    oauthProviders: Object.entries(settings.external)
      .filter(([name, enabled]) => enabled && name !== 'email' && name !== 'phone')
      .map(([name]) => name)
      .sort(),
    isEmailEnabled: settings.external.email === true,
    isSignupEnabled: !settings.disable_signup,
    needsEmailConfirmation: !settings.mailer_autoconfirm,
  };
}
