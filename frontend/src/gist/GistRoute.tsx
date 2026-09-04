/** One gist, rendered by the server, at `/g/:slug`. */
import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { FileTabs } from '@/chrome/FileTabs';
import { OfflineBand } from '@/chrome/OfflineBand';
import { CommandPalette } from '@/command/CommandPalette';
import type { CommandType } from '@/command/commands';
import { BinaryFile } from '@/gist/BinaryFile';
import { GistMeta } from '@/gist/GistMeta';
import { LinkBand } from '@/gist/LinkBand';
import { RenderedFile } from '@/gist/RenderedFile';
import { isNetworkError } from '@/lib/network-error';
import { useGist } from '@/lib/use-gist-queries';
import { useMyProfile } from '@/lib/use-my-profile';
import type { GistFileType } from '@/types';

type LocationStateType = {
  justCreated?: boolean;
};

export function GistRoute() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: gist, isPending, isError, error } = useGist(slug);
  const profile = useMyProfile();

  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [isBandDismissed, setBandDismissed] = useState(false);

  const justCreated = (location.state as LocationStateType | null)?.justCreated ?? false;
  const canEdit = Boolean(
    gist?.author && profile.data && profile.data.handle === gist.author.handle,
  );

  const commands: CommandType[] = gist
    ? [
        {
          id: 'copy-link',
          label: 'Copy the link',
          shortcut: '⌘C',
          perform: () => void navigator.clipboard.writeText(window.location.href),
        },
        ...(canEdit
          ? [
              {
                id: 'edit-gist',
                label: 'Edit this gist',
                shortcut: 'E',
                perform: () => navigate(`/g/${slug}/edit`),
              },
            ]
          : []),
      ]
    : [];

  if (isPending) {
    return (
      <>
        <GistSkeleton />
        <CommandPalette onNew={() => navigate('/')} />
      </>
    );
  }

  if (isError) {
    return (
      <>
        {isNetworkError(error) ? (
          <OfflineBand />
        ) : (
          <p className="text-sm text-[var(--body)]">
            That gist does not exist, or is not yours.{' '}
            <Link to="/new" className="underline">
              Start a new one
            </Link>
            .
          </p>
        )}
        <CommandPalette onNew={() => navigate('/')} />
      </>
    );
  }

  const files = gist.files;
  const activeFile: GistFileType | undefined =
    files.find((file) => file.filename === activeFileId) ?? files[0];

  return (
    <>
      <title>{`${gist.title} · quickgist`}</title>
      <meta name="description" content={gist.description || 'A gist on quickgist.'} />
      <meta property="og:title" content={gist.title} />
      <meta property="og:description" content={gist.description || 'A gist on quickgist.'} />

      {justCreated && !isBandDismissed ? (
        <LinkBand url={window.location.href} onDismiss={() => setBandDismissed(true)} />
      ) : null}

      <GistMeta
        gist={gist}
        rawUrl={activeFile ? rawUrlFor(slug, activeFile.filename) : undefined}
        editUrl={canEdit ? `/g/${slug}/edit` : undefined}
      />

      <main className="flex min-h-0 flex-1 flex-col">
        <div className="flex-none border-b border-[var(--border)]">
          <FileTabs
            files={files.map((file) => ({ id: file.filename, label: file.filename }))}
            activeId={activeFile?.filename ?? ''}
            onActivate={setActiveFileId}
          />
        </div>

        {activeFile ? (
          activeFile.kind === 'binary' ? (
            <BinaryFile file={activeFile} />
          ) : (
            <RenderedFile file={activeFile} />
          )
        ) : null}
      </main>

      <CommandPalette
        commands={commands}
        onNew={() => navigate('/')}
        onEdit={canEdit ? () => navigate(`/g/${slug}/edit`) : undefined}
        onSwitchFile={(index) => {
          const target = files[index];
          if (target) {
            setActiveFileId(target.filename);
          }
        }}
      />
    </>
  );
}

/** Where a file's unrendered source lives, matching the API's raw route. */
function rawUrlFor(slug: string, filename: string): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  return `${base}/v1/gists/${slug}/raw/${encodeURIComponent(filename)}`;
}

function GistSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden="true">
      <div className="h-5 w-1/3 bg-[var(--panel-2)]" />
      <div className="h-4 w-2/3 bg-[var(--panel-2)]" />
      <div className="flex gap-2 border-b border-[var(--border)] pb-2">
        <div className="h-6 w-20 bg-[var(--panel-2)]" />
        <div className="h-6 w-20 bg-[var(--panel-2)]" />
      </div>
      <div className="h-32 bg-[var(--panel-2)]" />
    </div>
  );
}
