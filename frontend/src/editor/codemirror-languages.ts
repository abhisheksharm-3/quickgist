/** Resolving a gist file to a CodeMirror language. */
import { LanguageDescription, type LanguageSupport } from '@codemirror/language';
import { languages } from '@codemirror/language-data';

/**
 * Finds the grammar for a file.
 *
 * `@codemirror/language-data` is a registry of around a hundred languages, each
 * behind its own dynamic import, so a Markdown gist never downloads the Rust parser.
 * An earlier version hand-mapped a dozen extensions, which meant a file called
 * `main.c` got no highlighting at all while the server happily rendered it: the
 * editor knew fewer languages than the renderer did.
 *
 * An explicit language wins over the filename, matching the server, so the editor
 * and the published page never disagree about what a file is.
 */
export function findLanguage(
  filename: string,
  language: string | null,
): LanguageDescription | null {
  if (language) {
    const named =
      LanguageDescription.matchLanguageName(languages, language, true) ??
      LanguageDescription.matchLanguageName(languages, language, false);
    if (named) {
      return named;
    }
  }

  return LanguageDescription.matchFilename(languages, filename);
}

/** Loads a grammar, returning null when the file has none. */
export async function loadLanguage(
  description: LanguageDescription | null,
): Promise<LanguageSupport | null> {
  if (!description) {
    return null;
  }
  return description.load();
}
