/** Files chosen from disk, on their way into a draft or into blob storage. */
import { useCallback, useState } from 'react';
import { uploadGistFile } from '@/api/gists';
import { readAttachment } from '@/logic/attachments';
import type {
  AttachedTextType,
  AttachmentsType,
  AttachmentType,
  EditorActionType,
} from '@/types/editor';

/**
 * Attaching files to the draft being edited.
 *
 * Text goes straight into the draft, so a dropped Markdown file is editable and
 * previewable before anything is published, and works with no account at all.
 * Anything that is not text cannot follow that path: the API accepts an upload only
 * against a gist that already exists and only from its owner, so those files wait
 * in a queue here and are sent once the gist has a slug.
 *
 * The queue holds `File` handles, which are the one part of the draft that cannot be
 * persisted to localStorage. Losing it on reload is the honest outcome: the bytes
 * live on the user's disk, not in the draft.
 */
export function useAttachments(
  dispatch: React.Dispatch<EditorActionType>,
  canUpload: boolean,
): AttachmentsType {
  const [queued, setQueued] = useState<File[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const accept = useCallback(
    async (chosen: FileList | File[] | null): Promise<void> => {
      const files = Array.from(chosen ?? []);
      if (files.length === 0) {
        return;
      }

      const read = await Promise.all(files.map((file) => readAttachment(file, canUpload)));

      const texts: AttachedTextType[] = read
        .filter((item): item is Extract<AttachmentType, { kind: 'text' }> => item.kind === 'text')
        .map(({ filename, content }) => ({ filename, content }));

      if (texts.length > 0) {
        dispatch({ type: 'attach', files: texts });
      }

      const binaries = read
        .filter(
          (item): item is Extract<AttachmentType, { kind: 'binary' }> => item.kind === 'binary',
        )
        .map((item) => item.file);

      if (binaries.length > 0) {
        setQueued((current) => [...current, ...binaries]);
      }

      const rejected = read.filter(
        (item): item is Extract<AttachmentType, { kind: 'rejected' }> => item.kind === 'rejected',
      );

      setNotice(
        rejected.length > 0
          ? rejected.map((item) => `${item.filename}: ${item.reason}`).join(' · ')
          : null,
      );
    },
    [dispatch, canUpload],
  );

  const remove = useCallback((name: string): void => {
    setQueued((current) => current.filter((file) => file.name !== name));
  }, []);

  const clear = useCallback((): void => {
    setQueued([]);
    setNotice(null);
  }, []);

  /**
   * Sends the queue, one file at a time.
   *
   * Each success leaves the queue immediately, so a failure halfway through can be
   * retried without uploading the same file twice.
   */
  const uploadQueued = useCallback(
    async (slug: string): Promise<void> => {
      for (const file of queued) {
        await uploadGistFile({ slug, file });
        setQueued((current) => current.filter((item) => item !== file));
      }
    },
    [queued],
  );

  return { queued, notice, accept, remove, uploadQueued, clear };
}
