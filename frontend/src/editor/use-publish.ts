/** Publishing a draft: create or save, send the queued uploads, then navigate. */
import { useActionState, useRef } from 'react';
import { useNavigate } from 'react-router';
import type { DraftFileType, PublishInputType, PublishResultType } from '@/editor/types';

import { clearPersistedDraft } from '@/editor/use-draft-persistence';
import { createGist, replaceGistFiles, updateGist } from '@/lib/gist-api';
import type { FileInputType } from '@/types';

/**
 * The publish action, as a form action.
 *
 * It lives apart from the editor because it is the one place in the frontend that
 * writes: three API calls in an order that matters, the upload queue, the persisted
 * draft, and the navigation that ends the flow. The editor renders; this decides
 * what publishing means.
 *
 * Returned as a `useActionState` triple so the form drives it and React tracks the
 * pending state, rather than a promise and a boolean kept in sync by hand.
 */
export function usePublish({
  slug,
  draft,
  settings,
  attachments,
  persistenceKey,
}: PublishInputType): [PublishResultType, () => void, boolean] {
  const navigate = useNavigate();

  /**
   * The slug of a gist this form already created.
   *
   * A publish that creates the gist and then fails to upload one of its files must
   * be retryable, and retrying without this made a second gist every time.
   */
  const createdSlug = useRef<string | undefined>(undefined);

  return useActionState<PublishResultType>(
    async (): Promise<PublishResultType> => {
      const files = toFileInputs(draft.files);
      const expiresAt = computeExpiresAt(settings.expiryDays);

      try {
        if (slug !== undefined) {
          await replaceGistFiles(slug, files);
          await updateGist(slug, {
            title: draft.title,
            visibility: settings.visibility,
            expiresAt,
          });
          await attachments.uploadQueued(slug);
          attachments.clear();
          clearPersistedDraft(persistenceKey);
          navigate(`/g/${slug}`);
          return { status: 'idle' };
        }

        const created =
          createdSlug.current ??
          (
            await createGist({
              title: draft.title || draft.files[0]?.filename || 'untitled',
              visibility: settings.visibility,
              expiresAt,
              files,
            })
          ).slug;
        createdSlug.current = created;

        await attachments.uploadQueued(created);
        attachments.clear();
        clearPersistedDraft(persistenceKey);
        navigate(`/g/${created}`, { state: { justCreated: true } });

        return { status: 'idle' };
      } catch (error) {
        return {
          status: 'error',
          message: error instanceof Error ? error.message : 'Could not publish this gist.',
        };
      }
    },
    { status: 'idle' },
  );
}

/** The draft's files in the shape the create and replace endpoints accept. */
function toFileInputs(files: DraftFileType[]): FileInputType[] {
  return files.map((file) => ({
    filename: file.filename,
    language: file.language,
    content: file.content,
  }));
}

/**
 * Turns a number of days into an expiry timestamp.
 *
 * An empty or unparseable value means no expiry rather than an error, because the
 * control offers "never" as a choice and that is what it sends.
 */
function computeExpiresAt(days: string): string | null {
  const parsed = Number(days);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return new Date(Date.now() + parsed * 24 * 60 * 60 * 1000).toISOString();
}
