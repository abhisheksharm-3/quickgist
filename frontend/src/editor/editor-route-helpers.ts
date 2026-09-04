/** Pure helpers for `EditorRoute`, split out to keep the component itself readable. */
import type { DraftFileType } from '@/editor/types';
import type { FileInputType } from '@/types';

export function toFileInputs(files: DraftFileType[]): FileInputType[] {
  return files.map((file) => ({
    filename: file.filename,
    language: file.language,
    content: file.content,
  }));
}

export function computeExpiresAt(days: string): string | null {
  const parsed = Number(days);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return new Date(Date.now() + parsed * 24 * 60 * 60 * 1000).toISOString();
}

export type HotkeyLikeType = { combo: string; handler: () => void };

export function digitSwitchBindings(onSwitch: (index: number) => void): HotkeyLikeType[] {
  return Array.from({ length: 9 }, (_, index) => ({
    combo: String(index + 1),
    handler: () => onSwitch(index),
  }));
}
