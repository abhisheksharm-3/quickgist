/**
 * Registers global keyboard shortcuts for the lifetime of the calling
 * component.
 *
 * A binding with no modifier is suppressed while focus sits in a text input,
 * a textarea, or a contenteditable element, so typing the letter "e" never
 * fires the single-letter "edit" shortcut. A binding with `mod` (Cmd on Mac,
 * Ctrl elsewhere) or `shift` always fires.
 */
import { useEffect, useEffectEvent } from 'react';
import type { HotkeyBindingType } from '@/types/chrome';

export function useHotkeys(bindings: HotkeyBindingType[]): void {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const combo = describeCombo(event);
    const binding = bindings.find((candidate) => candidate.combo === combo);
    if (!binding) return;
    if (!hasModifier(combo) && isTypingTarget(event.target)) return;

    event.preventDefault();
    binding.handler(event);
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent): void => handleKeyDown(event);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);
}

function hasModifier(combo: string): boolean {
  return combo.includes('mod+') || combo.includes('shift+');
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}

function describeCombo(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.metaKey || event.ctrlKey) parts.push('mod');
  if (event.shiftKey) parts.push('shift');
  parts.push(event.key.toLowerCase());
  return parts.join('+');
}

/**
 * Bindings for switching to file n with the number keys.
 *
 * Built here rather than at each call site because the count and the off-by-one
 * between a key and an index are the kind of detail worth stating once.
 */
export function digitSwitchBindings(onSwitch: (index: number) => void): HotkeyBindingType[] {
  return Array.from({ length: 9 }, (_, index) => ({
    combo: String(index + 1),
    handler: () => onSwitch(index),
  }));
}
