/** The one piece of marketing in the product. */

/**
 * The hero line.
 *
 * It renders only on an untouched new draft and disappears on the first keystroke,
 * so it introduces the tool without permanently taking height from it. The serif
 * italic appears here and nowhere else in the app.
 */
export function EditorHero() {
  return (
    <div className="flex-none border-b border-[var(--border)] px-5 py-6 text-center sm:py-8">
      <h1 className="font-serif text-[24px] leading-tight font-light italic tracking-[-0.01em] text-[var(--heading)] sm:text-[28px]">
        Paste it. Send it.
      </h1>
      <p className="mt-1.5 text-[12px] text-[var(--dim)]">
        Markdown and code, rendered properly, in one link. No account needed.
      </p>
    </div>
  );
}
