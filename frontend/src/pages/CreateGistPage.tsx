/** Creates a gist from a single file. */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useCreateGist } from '@/lib/use-gist-queries';
import type { VisibilityType } from '@/types';

const VISIBILITIES: VisibilityType[] = ['unlisted', 'public', 'private'];

export function CreateGistPage() {
  const navigate = useNavigate();
  const createGist = useCreateGist();

  const [title, setTitle] = useState('');
  const [filename, setFilename] = useState('README.md');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<VisibilityType>('unlisted');

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();

    createGist.mutate(
      { title, visibility, files: [{ filename, content }] },
      { onSuccess: (gist) => void navigate(`/g/${gist.slug}`) },
    );
  };

  return (
    <main>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="block text-sm">Title</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="block text-sm">Filename</span>
          <input
            value={filename}
            onChange={(event) => setFilename(event.target.value)}
            required
            className="mt-1 w-full rounded border px-3 py-2 font-mono"
          />
        </label>

        <label className="block">
          <span className="block text-sm">Content</span>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
            rows={16}
            className="mt-1 w-full rounded border px-3 py-2 font-mono"
          />
        </label>

        <label className="block">
          <span className="block text-sm">Visibility</span>
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as VisibilityType)}
            className="mt-1 rounded border px-3 py-2"
          >
            {VISIBILITIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <button type="submit" disabled={createGist.isPending} className="rounded border px-4 py-2">
          {createGist.isPending ? 'Creating…' : 'Create gist'}
        </button>

        {createGist.isError ? <p className="text-sm">{createGist.error.message}</p> : null}
      </form>
    </main>
  );
}
