/** The route that matches nothing. */
import { EmptyState } from '@/chrome/EmptyState';

export function NotFoundPage() {
  return (
    <>
      <title>Not found · quickgist</title>
      <meta name="robots" content="noindex" />

      <EmptyState
        code="404"
        title="Nothing at this address"
        actions={[
          { label: 'Start a gist', to: '/', primary: true },
          { label: 'Explore', to: '/explore' },
        ]}
      >
        This URL does not match a gist or a page. If someone sent you a link, the gist may have
        expired, or its author may have deleted it.
      </EmptyState>
    </>
  );
}
