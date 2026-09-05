/** What the footer links to.
 *
 * Only destinations that exist: a footer full of links to nothing is worse than a
 * short footer.
 */
import type { FooterColumnType } from '@/chrome/types';

const REPOSITORY = 'https://github.com/abhisheksharm-3/quickgist';

/**
 * The columns, holding only destinations that exist.
 *
 * A footer full of links to nothing is worse than a short footer, so this lists the
 * routes the app actually serves and the repository it actually lives in.
 */
export const FOOTER_COLUMNS: FooterColumnType[] = [
  {
    heading: 'Product',
    links: [
      { label: 'New gist', to: '/' },
      { label: 'Explore', to: '/explore' },
      { label: 'Your gists', to: '/me' },
    ],
  },
  {
    heading: 'Reference',
    links: [
      { label: 'About', to: '/about' },
      { label: 'The stack', to: '/about#stack' },
      { label: 'Keyboard map', to: '/about#keyboard' },
    ],
  },
  {
    heading: 'Project',
    links: [
      { label: 'Source', to: REPOSITORY, external: true },
      { label: 'Issues', to: `${REPOSITORY}/issues`, external: true },
      { label: 'Zed', to: 'https://zed.dev', external: true },
      { label: 'Abhishek Sharma', to: 'https://abhisheksan.com', external: true },
    ],
  },
];
