/** Validating a handle in the browser, against the same rule the database uses. */

/**
 * The pattern from the profiles table's check constraint.
 *
 * It is repeated here so somebody choosing a handle is told immediately rather than
 * after a round trip, and the two must stay in step: the database is the authority
 * and this is only a courtesy.
 */
const HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}$/;

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
