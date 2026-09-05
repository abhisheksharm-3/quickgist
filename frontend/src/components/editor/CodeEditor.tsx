/** The CodeMirror editing surface. */
import { useCodemirror } from '@/hooks/useCodemirror';
import type { CodeEditorPropsType } from '@/types/editor';

/**
 * The editor.
 *
 * Every decision about what CodeMirror is and how it stays in step with React lives
 * in the hook; this is the element it mounts into.
 */
export function CodeEditor({
  value,
  onChange,
  filename,
  language,
  ariaLabel,
}: CodeEditorPropsType) {
  const hostRef = useCodemirror({ value, onChange, filename, language, ariaLabel });

  return <div ref={hostRef} className="h-full min-h-0 overflow-hidden" />;
}
