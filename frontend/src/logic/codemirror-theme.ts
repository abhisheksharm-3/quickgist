/** The CodeMirror theme, matched to the app's tokens. */
import { HighlightStyle } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';

/**
 * Layout and chrome for the editor.
 *
 * Colours come from the same custom properties as the rest of the app, so the editor
 * follows a theme change without CodeMirror knowing a theme exists.
 */
export const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '12px',
    backgroundColor: 'transparent',
    color: 'var(--text)',
  },
  '.cm-scroller': {
    fontFamily: 'var(--font-mono)',
    lineHeight: '1.75',
    padding: '0.85rem 0',
  },
  '.cm-content': { caretColor: 'var(--blue-action)' },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--faint)',
    border: 'none',
    borderRight: '1px solid var(--border)',
    paddingRight: '0.35rem',
    minWidth: '2.5rem',
  },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 0.5rem 0 0.75rem' },
  '.cm-activeLine': { backgroundColor: 'color-mix(in oklab, var(--panel) 60%, transparent)' },
  '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--dim)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
    backgroundColor: 'color-mix(in oklab, var(--blue-action) 30%, transparent)',
  },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--blue-action)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-placeholder': { color: 'var(--faint)' },
  '.cm-matchingBracket': {
    backgroundColor: 'color-mix(in oklab, var(--blue-action) 22%, transparent)',
    outline: 'none',
  },
});

/**
 * Token colours for the light theme, taken from One Light so the editor and the
 * server's rendered output use one palette.
 */
export const lightHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#a626a4' },
  { tag: [tags.name, tags.deleted, tags.character, tags.propertyName], color: '#383a41' },
  { tag: [tags.function(tags.variableName), tags.labelName], color: '#4078f2' },
  { tag: [tags.typeName, tags.className, tags.tagName], color: '#c18401' },
  { tag: [tags.number, tags.bool, tags.null], color: '#986801' },
  { tag: [tags.string, tags.special(tags.string)], color: '#50a14f' },
  { tag: tags.comment, color: '#a0a1a7', fontStyle: 'italic' },
  { tag: tags.heading, color: '#4078f2', fontWeight: '600' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: '600' },
  { tag: tags.link, color: '#0184bc', textDecoration: 'underline' },
  { tag: tags.invalid, color: '#e45649' },
]);
