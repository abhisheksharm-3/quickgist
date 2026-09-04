/** The link-ready band: one of the product's only two full blue surfaces. */
import { Check, Copy, X } from 'lucide-react';
import { useState } from 'react';

type LinkBandPropsType = {
  url: string;
  onDismiss: () => void;
};

/**
 * The band shown once, right after a gist is created.
 *
 * It sits above the rendered document rather than on a page of its own, which
 * answers the question you actually have at that second: here is the link, and
 * directly below it, proof the rendering came out right. A confirmation page would
 * make you click through to find out.
 *
 * It announces itself to a screen reader as it arrives instead of making a reader
 * hunt for the link.
 */
export function LinkBand({ url, onDismiss }: LinkBandPropsType) {
  const [justCopied, setJustCopied] = useState(false);

  const handleCopy = (): void => {
    void navigator.clipboard.writeText(url).then(() => {
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 2000);
    });
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative isolate overflow-hidden border-b border-[var(--blue-field)] bg-[var(--blue-field)] px-5 py-4 text-white sm:px-8 sm:py-5"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:repeating-linear-gradient(to_right,rgb(255_255_255/8%)_0_1px,transparent_1px_26px),repeating-linear-gradient(to_bottom,rgb(255_255_255/8%)_0_1px,transparent_1px_26px)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-2 -bottom-10 text-[6rem] leading-none font-semibold tracking-[-0.05em] text-transparent [-webkit-text-stroke:1px_rgb(255_255_255/16%)]"
      >
        quickgist
      </span>

      <div className="relative flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.13em] text-white/75 uppercase">
            Ready to share
          </p>
          <p className="mt-1.5 truncate font-mono text-[15px] tracking-[-0.01em]">{url}</p>
          <p className="mt-1.5 text-[11.5px] text-white/70">
            Anyone with this link can read it. The rendered document is below.
          </p>
        </div>

        <div className="flex flex-none items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[var(--blue-field)]"
          >
            {justCopied ? (
              <Check className="size-3.5" aria-hidden />
            ) : (
              <Copy className="size-3.5" aria-hidden />
            )}
            {justCopied ? 'Copied' : 'Copy link'}
          </button>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="grid size-[30px] place-items-center border border-white/35 text-white/85 hover:bg-white/10"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
