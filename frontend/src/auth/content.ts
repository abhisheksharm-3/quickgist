/** What the account pages say: why an account is worth having, and what each
 * provider is called.
 */
import type { AuthBenefitType } from '@/auth/types';

export const BENEFITS: AuthBenefitType[] = [
  {
    title: 'Private gists',
    detail: 'Visible only to you. Anyone else gets the same 404 as a link that never existed.',
  },
  {
    title: 'Editing',
    detail: 'Change a published gist, add files, or delete it. The link stays the same.',
  },
  {
    title: 'One page with all of it',
    detail:
      'Everything you have made, including the unlisted ones you would otherwise have to bookmark.',
  },
  {
    title: 'A handle',
    detail: 'Your public gists get an address at /u/your-handle.',
  },
];

export const PROVIDER_LABELS: Record<string, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  google: 'Google',
  bitbucket: 'Bitbucket',
  azure: 'Microsoft',
};
