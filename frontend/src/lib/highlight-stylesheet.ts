/** Loads the highlight stylesheet the API generates. */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * Links the stylesheet that styles server-rendered code.
 *
 * It is fetched from the API rather than bundled because the classes in the HTML
 * and the rules that style them are produced by the same renderer, so shipping
 * them together keeps them from drifting apart.
 */
export function loadHighlightStylesheet(): void {
  const href = `${API_BASE_URL}/v1/highlight.css`;

  if (document.querySelector(`link[href="${href}"]`)) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(link);
}
