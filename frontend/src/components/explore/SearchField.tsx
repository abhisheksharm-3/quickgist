/** The search input for the public feed, focusable from outside via `ref`. */
import { Search } from 'lucide-react';
import type { SearchFieldPropsType } from '@/types/explore';

export function SearchField({ value, onChange, ref }: SearchFieldPropsType) {
  return (
    <div className="flex items-center gap-2.5 border border-[var(--border-strong)] bg-[var(--panel-2)] px-3 focus-within:border-[var(--blue-action)]">
      <Search className="size-3.5 flex-none text-[var(--faint)]" aria-hidden />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search titles, descriptions and the text inside public gists"
        aria-label="Search public gists"
        className="w-full bg-transparent py-2 text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--faint)]"
      />
      <kbd className="flex-none font-mono text-[10px] text-[var(--faint)]">/</kbd>
    </div>
  );
}
