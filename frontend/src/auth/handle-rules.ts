import { HANDLE_PATTERN } from '@/auth/constants';
/** Validating a handle in the browser, against the same rule the database uses. */

export function handleError(handle: string): string | null {
  if (handle.length === 0) {
    return 'Pick a handle. It appears on the gists you publish.';
  }
  if (handle.length < 2) {
    return 'A handle needs at least two characters.';
  }
  if (handle.length > 39) {
    return 'A handle can be at most 39 characters.';
  }
  if (!HANDLE_PATTERN.test(handle)) {
    return 'Use lowercase letters, numbers and hyphens, starting with a letter or number.';
  }
  return null;
}

/** Turns a display name into a plausible handle, for the field's initial value. */
export function suggestHandle(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 39);
}
