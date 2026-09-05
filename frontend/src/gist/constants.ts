/** What the reader's enhancements look for in a rendered document, and the class
 * string its actions share.
 */

export const BLOCK_SELECTOR = '.code-block, .chroma';

export const BUTTON_CLASS = 'code-copy';

export const SELECTOR = '[data-language="mermaid"]';

export const MIN_HEADINGS = 3;

export const action =
  'flex items-center gap-1.5 border border-[var(--border-strong)] bg-[var(--panel-2)] px-2.5 py-1 text-[11.5px] text-[var(--dim)] transition-colors hover:border-[var(--dim)] hover:text-[var(--heading)]';
