/** The site footer: the second and last blue field in the product. */
import { Link } from 'react-router';
import { useMyProfile } from '@/api/useMyProfile';
import { columnHeading, footerLink } from '@/constants/chrome';
import { FOOTER_COLUMNS } from '@/content/chrome';
import { useSession } from '@/hooks/useSession';
import type { FooterLinkPropsType } from '@/types/chrome';

/**
 * The footer.
 *
 * One of exactly two blue surfaces in the product, the other being the band shown
 * when a link is created. They never share a screen, because this is the end of the
 * page and that is the top of a gist. A third would cost both of them their meaning.
 *
 * The four cells are equal and divided by hairlines that run the full height of the
 * row, so every column starts on the same line. They used to be sized 1.6fr to 1fr
 * with a border on each cell, which left the rules floating at three different
 * heights.
 *
 * The lower half is deliberately mostly empty: an outlined wordmark over a diagonal
 * hatch, bled off the bottom edge. That space is the point, not padding to trim.
 */
export function Footer() {
  const { user } = useSession();
  const profile = useMyProfile();

  const year = new Date().getFullYear();
  const accountName = profile.data?.display_name || profile.data?.handle;

  return (
    <footer className="blueprint-field relative isolate mt-auto overflow-hidden bg-[var(--blue-field)] text-white">
      <FooterTexture />

      <div className="relative grid md:grid-cols-4 md:divide-x md:divide-white/25">
        <div className="px-5 py-9 sm:px-8">
          <p className={columnHeading}>quickgist</p>
          <ul className="mt-4 space-y-2.5">
            <li>
              {user ? (
                <Link to="/me" className={footerLink}>
                  {accountName ?? 'Your account'}
                </Link>
              ) : (
                <Link to="/sign-in" className={footerLink}>
                  Sign in
                </Link>
              )}
            </li>
            <li>
              <Link to="/about" className={footerLink}>
                What this is
              </Link>
            </li>
          </ul>
          <p className="mt-6 max-w-[30ch] text-[12.5px] leading-[1.6] text-white/70">
            Markdown and code, rendered on the server, in one link. No account needed.
          </p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div key={column.heading} className="px-5 py-9 sm:px-8">
            <p className={columnHeading}>{column.heading}</p>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="relative border-t border-white/25 px-5 pt-4 pb-40 sm:px-8">
        <p className="text-[12.5px] text-white/80">
          quickgist © {year}. Interface design language adapted with thanks from{' '}
          <a href="https://zed.dev" className="underline underline-offset-[3px] hover:text-white">
            Zed
          </a>
          . Typeset in IBM Plex. Rendered by goldmark and chroma. Built by{' '}
          <a
            href="https://abhisheksan.com"
            className="underline underline-offset-[3px] hover:text-white"
            target="_blank"
            rel="noreferrer"
          >
            Abhishek Sharma
          </a>
          .
        </p>
      </div>

      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-[0.28em] left-3 -z-10 w-full text-[clamp(5rem,17vw,15rem)] leading-none font-semibold tracking-[-0.055em] whitespace-nowrap text-transparent [-webkit-text-stroke:1px_rgb(255_255_255/22%)]"
      >
        quickgist
      </span>
    </footer>
  );
}

function FooterLink({ link }: FooterLinkPropsType) {
  if (link.external) {
    return (
      <a href={link.to} className={footerLink} target="_blank" rel="noreferrer">
        {link.label} <span aria-hidden>↗</span>
      </a>
    );
  }

  return (
    <Link to={link.to} className={footerLink}>
      {link.label}
    </Link>
  );
}

/**
 * The blueprint grid and diagonal hatch carried onto the blue field, both at a
 * higher contrast than on the dark ground because the blue swallows a 2% hairline.
 */
function FooterTexture() {
  return (
    <>
      <span aria-hidden className="blueprint-cells pointer-events-none absolute inset-0 -z-10" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/3 [background-image:repeating-linear-gradient(45deg,rgb(255_255_255/5%)_0_1px,transparent_1px_7px)]"
      />
    </>
  );
}
