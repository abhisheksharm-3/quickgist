/** The editor's fixed values: what it accepts, how long it waits, what it stores.
 *
 * The two size ceilings repeat the API's own limits so a file that cannot be
 * accepted is refused before it is sent. The debounces are the reason the preview
 * endpoint's rate limit is set where it is: raise one and the other has to move.
 */

export const MAX_TEXT_BYTES = 1 << 20;

export const MAX_UPLOAD_BYTES = 10 << 20;

/**
 * The default filename carries a Markdown extension deliberately.
 *
 * The renderer classifies by extension or explicit language, so an extensionless
 * default meant a pasted Markdown document rendered as plain text in a product whose
 * whole point is rendering Markdown.
 */
export const DEFAULT_FILE_EXTENSION = '.md';

/** The API's own ceiling, so the + button cannot build a draft that fails to save. */
export const MAX_FILES_PER_GIST = 20;

/**
 * The version in the prefix is deliberate.
 *
 * v2 came from the default filename gaining a `.md` extension, since a draft stored
 * under the old shape came back with a filename the renderer treats as plain text.
 * v3 discards the empty drafts an edit route used to persist before its gist had
 * loaded, which would otherwise keep opening blank for as long as they are stored.
 */
export const STORAGE_PREFIX = 'quickgist:draft:v3:';

export const DEFAULT_DEBOUNCE_MS = 400;

export const DEFAULT_RETRY_AFTER_SECONDS = 60;

export const TITLE_SAVE_DEBOUNCE_MS = 500;

/**
 * `never` is a sentinel rather than an empty string, because Radix reserves the
 * empty string to mean a cleared selection and would render a blank trigger.
 */
export const EXPIRY_NEVER = 'never';
