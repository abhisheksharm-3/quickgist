/** Building and keeping a CodeMirror view alive for a React component. */
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { EditorState, type Extension } from '@codemirror/state';
import { oneDark, oneDarkHighlightStyle } from '@codemirror/theme-one-dark';
import { EditorView, keymap, lineNumbers, placeholder } from '@codemirror/view';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EDITOR_PLACEHOLDER } from '@/constants/editor';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { findLanguage, loadLanguage } from '@/logic/codemirror-languages';
import { editorTheme, lightHighlightStyle } from '@/logic/codemirror-theme';
import type { UseCodemirrorOptionsType } from '@/types/editor';

/**
 * Returns the ref to mount the editor into.
 *
 * Extensions are composed by hand rather than taking CodeMirror's `basicSetup`,
 * which also pulls in search, autocompletion and lint gutters that a paste box has
 * no use for. Line wrapping is on because most of what people paste here is prose.
 *
 * The grammar arrives through a dynamic import, so a Markdown gist never downloads
 * the Rust parser.
 *
 * The document seeds the view once, read from a ref so it stays out of the setup
 * effect's dependencies: with the value itself in there, typing a character rebuilt
 * the editor and lost the cursor. A change arriving from outside is dispatched into
 * the running view instead, which is the second effect.
 */
export function useCodemirror({
  value,
  onChange,
  filename,
  language,
  ariaLabel,
}: UseCodemirrorOptionsType): React.RefObject<HTMLDivElement | null> {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const initialValueRef = useRef(value);
  initialValueRef.current = value;

  const resolved = useResolvedTheme();
  const description = useMemo(() => findLanguage(filename, language), [filename, language]);
  const [languageExtension, setLanguageExtension] = useState<Extension | null>(null);

  useEffect(() => {
    let isCurrent = true;

    void loadLanguage(description).then((support) => {
      if (isCurrent) {
        setLanguageExtension(support ?? null);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [description]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const extensions: Extension[] = [
      lineNumbers(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      bracketMatching(),
      indentOnInput(),
      EditorView.lineWrapping,
      placeholder(EDITOR_PLACEHOLDER),
      editorTheme,
      resolved === 'dark'
        ? [oneDark, syntaxHighlighting(oneDarkHighlightStyle)]
        : syntaxHighlighting(lightHighlightStyle),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString());
        }
      }),
      EditorView.contentAttributes.of({ 'aria-label': ariaLabel }),
    ];

    if (languageExtension) {
      extensions.push(languageExtension);
    }

    const view = new EditorView({
      state: EditorState.create({ doc: initialValueRef.current, extensions }),
      parent: host,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [languageExtension, resolved, ariaLabel]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === value) {
      return;
    }

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    });
  }, [value]);

  return hostRef;
}
