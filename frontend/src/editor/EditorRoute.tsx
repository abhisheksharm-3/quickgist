/**
 * The editor: paste or load a multi-file draft, preview it, and publish it.
 *
 * Mounted at `/` for a new gist and at `/g/:slug/edit` for an existing one.
 * Both panes stay mounted always; the one the toggle is not showing keeps its
 * scroll position and state alive inside `<Activity mode="hidden">` instead of
 * unmounting.
 */

import { Paperclip } from 'lucide-react';
import { Activity, useActionState, useEffect, useReducer, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useNavigate, useParams } from 'react-router';
import { useSession } from '@/auth/use-session';
import { EmptyState } from '@/chrome/EmptyState';
import { FileTabs } from '@/chrome/FileTabs';
import { KeyboardBadge } from '@/chrome/KeyboardBadge';
import { StatusBar } from '@/chrome/StatusBar';
import { useHotkeys } from '@/chrome/use-hotkeys';
import { AttachmentQueue } from '@/editor/AttachmentQueue';
import { EditorHero } from '@/editor/EditorHero';
import { createDraftFromGist, createEmptyDraft, editorReducer } from '@/editor/editor-reducer';
import { computeExpiresAt, digitSwitchBindings, toFileInputs } from '@/editor/editor-route-helpers';
import { PreviewPane } from '@/editor/PreviewPane';
import { PublishControls } from '@/editor/PublishControls';
import { SourcePane } from '@/editor/SourcePane';
import type { EditorActionType } from '@/editor/types';
import { useAttachments } from '@/editor/use-attachments';
import {
  clearPersistedDraft,
  loadPersistedDraft,
  usePersistDraft,
} from '@/editor/use-draft-persistence';
import { createGist, replaceGistFiles, updateGist } from '@/lib/gist-api';
import { useGist } from '@/lib/use-gist-queries';
import { useMyProfile } from '@/lib/use-my-profile';
import type { GistType, VisibilityType } from '@/types';

type PublishResultType = { status: 'idle' } | { status: 'error'; message: string };

const TITLE_SAVE_DEBOUNCE_MS = 500;

export function EditorRoute(): React.JSX.Element {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const isEditMode = slug !== undefined;
  const navigate = useNavigate();

  const gistQuery = useGist(slug ?? '');
  const persistenceKey = isEditMode ? `edit:${slug}` : 'new';

  const [draft, dispatch] = useReducer(
    editorReducer,
    persistenceKey,
    (key) => loadPersistedDraft(key) ?? createEmptyDraft(),
  );

  const [hadStoredDraft] = useState(() => loadPersistedDraft(persistenceKey) !== null);
  const needsGist = isEditMode && !hadStoredDraft;
  const isDraftReady = !needsGist || gistQuery.data !== undefined;

  usePersistDraft(persistenceKey, draft, isDraftReady);
  useRestoreFromGist(needsGist, gistQuery.data, dispatch);

  const { user } = useSession();
  const profile = useMyProfile();
  const attachments = useAttachments(dispatch, Boolean(user));

  const title = draft.title;
  const titleSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(titleSaveTimer.current), []);

  const handleTitleChange = (nextTitle: string): void => {
    dispatch({ type: 'title', title: nextTitle });

    if (!isEditMode || !slug) {
      return;
    }

    clearTimeout(titleSaveTimer.current);
    titleSaveTimer.current = setTimeout(() => {
      void updateGist(slug, { title: nextTitle }).catch(() => undefined);
    }, TITLE_SAVE_DEBOUNCE_MS);
  };

  const handleAddFile = (): void => {
    dispatch({ type: 'add' });
  };

  const [visibility, setVisibility] = useState<VisibilityType>('unlisted');
  const [expiryDays, setExpiryDays] = useState('');
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  /**
   * The slug of a gist this form already created.
   *
   * A publish that creates the gist and then fails to upload one of its files must
   * be retryable, and retrying without this made a second gist every time.
   */
  const createdSlug = useRef<string | undefined>(undefined);

  useHotkeys([
    { combo: 'mod+shift+p', handler: () => setIsPreviewVisible((visible) => !visible) },
    { combo: 'mod+enter', handler: () => formRef.current?.requestSubmit() },
    { combo: 'mod+s', handler: () => formRef.current?.requestSubmit() },
    ...digitSwitchBindings((index) => dispatch({ type: 'switch', index })),
  ]);

  const [publishResult, publishAction, isPublishing] = useActionState<PublishResultType>(
    async (): Promise<PublishResultType> => {
      const files = toFileInputs(draft.files);
      const expiresAt = computeExpiresAt(expiryDays);

      try {
        if (isEditMode && slug) {
          await replaceGistFiles(slug, files);
          await updateGist(slug, { title, visibility, expiresAt });
          await attachments.uploadQueued(slug);
          attachments.clear();
          clearPersistedDraft(persistenceKey);
          navigate(`/g/${slug}`);
        } else {
          const created =
            createdSlug.current ??
            (
              await createGist({
                title: title || draft.files[0]?.filename || 'untitled',
                visibility,
                expiresAt,
                files,
              })
            ).slug;
          createdSlug.current = created;

          await attachments.uploadQueued(created);
          attachments.clear();
          clearPersistedDraft(persistenceKey);
          navigate(`/g/${created}`, { state: { justCreated: true } });
        }
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

  const activeFile = draft.files[draft.activeIndex];

  if (isEditMode && gistQuery.isLoading) {
    return <p className="p-6 text-sm text-[var(--dim)]">Loading gist…</p>;
  }

  if (isEditMode && gistQuery.isError) {
    return (
      <EmptyState code="Not found" title="That gist could not be loaded">
        It may have been deleted, or it may be private to somebody else. Either way there is nothing
        here to edit.
      </EmptyState>
    );
  }

  if (isEditMode && gistQuery.data && !isMine(gistQuery.data, profile.data?.handle)) {
    return (
      <EmptyState
        code="Read only"
        title="This gist is not yours"
        actions={[
          { label: 'Read it', to: `/g/${slug}`, primary: true },
          { label: 'Start your own', to: '/' },
        ]}
      >
        Only the author of a gist can change it. Opening this address as somebody else used to show
        an editor whose save the API would refuse.
      </EmptyState>
    );
  }

  if (!activeFile) {
    return <p className="p-6 text-sm text-[var(--dim)]">Nothing to edit.</p>;
  }

  const isUntouchedNewDraft =
    !isEditMode && draft.files.length === 1 && activeFile.content === '' && title === '';

  return (
    <form
      ref={formRef}
      action={publishAction}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        void attachments.accept(event.dataTransfer.files);
      }}
      className="flex h-[calc(100dvh-var(--chrome-h))] min-h-0 flex-col"
    >
      {isUntouchedNewDraft ? <EditorHero /> : null}

      <div className="flex flex-none items-center gap-4 border-b border-[var(--border)] px-5 py-3 sm:px-8">
        <input
          value={title}
          onChange={(event) => handleTitleChange(event.target.value)}
          placeholder="Name this gist"
          aria-label="Gist title"
          className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold tracking-[-0.02em] text-[var(--heading)] outline-none placeholder:font-normal placeholder:text-[var(--faint)]"
        />
        <p className="flex-none font-mono text-[10.5px] text-[var(--faint)]">
          {draft.files.length} {draft.files.length === 1 ? 'file' : 'files'}
        </p>
      </div>

      <div className="flex flex-none items-stretch border-b border-[var(--border)]">
        <FileTabs
          files={draft.files.map((file) => ({ id: file.id, label: file.filename }))}
          activeId={activeFile.id}
          onActivate={(id) => {
            const index = draft.files.findIndex((file) => file.id === id);
            if (index >= 0) dispatch({ type: 'switch', index });
          }}
          onRename={(id, filename) => {
            const index = draft.files.findIndex((file) => file.id === id);
            if (index >= 0) dispatch({ type: 'rename', index, filename });
          }}
          onClose={(id) => {
            const index = draft.files.findIndex((file) => file.id === id);
            if (index >= 0) dispatch({ type: 'remove', index });
          }}
          onAdd={handleAddFile}
        />

        <label className="ml-auto flex flex-none cursor-pointer items-center gap-1.5 border-l border-[var(--border)] px-3 text-[11px] text-[var(--dim)] hover:bg-[var(--panel)] hover:text-[var(--heading)]">
          <Paperclip className="size-3" aria-hidden />
          Attach files
          <input
            type="file"
            multiple
            className="sr-only"
            onChange={(event) => {
              void attachments.accept(event.target.files);
              event.target.value = '';
            }}
          />
        </label>
      </div>

      <AttachmentQueue
        queued={attachments.queued}
        notice={attachments.notice}
        onRemove={attachments.remove}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden">
        <Activity mode={isPreviewVisible ? 'hidden' : 'visible'}>
          <SourcePane
            ariaLabel={`Source for ${activeFile.filename}`}
            filename={activeFile.filename}
            language={activeFile.language}
            value={activeFile.content}
            onChange={(content) => dispatch({ type: 'edit', index: draft.activeIndex, content })}
          />
        </Activity>
        <Activity mode={isPreviewVisible ? 'visible' : 'hidden'}>
          <PreviewPane file={activeFile} />
        </Activity>
      </div>

      <StatusBar
        start={
          <PublishControls
            visibility={visibility}
            onVisibilityChange={setVisibility}
            expiryDays={expiryDays}
            onExpiryDaysChange={setExpiryDays}
            disabled={isPublishing}
          />
        }
        center={
          publishResult.status === 'error' ? <ErrorBand message={publishResult.message} /> : null
        }
        end={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewVisible((visible) => !visible)}
              aria-pressed={isPreviewVisible}
              className="flex items-center gap-1.5 px-1.5 py-0.5 text-[11px] text-[var(--dim)] hover:text-[var(--heading)]"
            >
              {isPreviewVisible ? 'Show source' : 'Show preview'}
              <KeyboardBadge>⌘⇧P</KeyboardBadge>
            </button>
            <KeyboardBadge>{isEditMode ? '⌘S' : '⌘↵'}</KeyboardBadge>
            <SubmitButton
              label={isEditMode ? 'Save' : 'Create gist'}
              pendingLabel={isEditMode ? 'Saving…' : 'Creating…'}
            />
          </div>
        }
      />
    </form>
  );
}

/**
 * Loads the published gist into the draft, once.
 *
 * Whether a stored draft already exists is decided at mount by the caller rather
 * than read from storage here, because this effect runs after the one that persists
 * the draft: reading storage at this point found what that effect had just written.
 */
function useRestoreFromGist(
  needsGist: boolean,
  gist: GistType | undefined,
  dispatch: React.Dispatch<EditorActionType>,
): void {
  const restored = useRef(false);

  useEffect(() => {
    if (!needsGist || restored.current || !gist) return;

    dispatch({ type: 'replace', draft: createDraftFromGist(gist) });
    restored.current = true;
  }, [needsGist, gist, dispatch]);
}

/**
 * Whether the signed-in caller wrote this gist.
 *
 * An anonymous gist has no author and so belongs to nobody, which makes it
 * uneditable by anyone rather than editable by everyone.
 */
function isMine(gist: GistType, handle: string | undefined): boolean {
  return gist.author !== null && handle !== undefined && gist.author.handle === handle;
}

type SubmitButtonProps = {
  label: string;
  pendingLabel: string;
};

function SubmitButton({ label, pendingLabel }: SubmitButtonProps): React.JSX.Element {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-[var(--blue-action)] px-3 py-1 text-[11px] font-medium text-white disabled:opacity-50"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function ErrorBand({ message }: { message: string }): React.JSX.Element {
  return (
    <p role="alert" className="text-[11px] text-[var(--dim)]">
      {message}
    </p>
  );
}
