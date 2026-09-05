/** The choices the publish controls offer, and what each is called. */
import { EXPIRY_NEVER } from '@/editor/constants';
import type { SelectOptionType } from '@/ui/types';

export const VISIBILITY_OPTIONS: SelectOptionType[] = [
  { value: 'unlisted', label: 'unlisted' },
  { value: 'public', label: 'public' },
  { value: 'private', label: 'private' },
];

export const EXPIRY_OPTIONS: SelectOptionType[] = [
  { value: EXPIRY_NEVER, label: 'never expires' },
  { value: '1', label: 'expires in 1 day' },
  { value: '7', label: 'expires in 7 days' },
  { value: '30', label: 'expires in 30 days' },
];
