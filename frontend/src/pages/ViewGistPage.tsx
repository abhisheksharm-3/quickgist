/** One gist, rendered by the server. */
import { useParams } from 'react-router';
import { useGist } from '@/lib/use-gist-queries';
import type { GistFileType } from '@/types';

export function ViewGistPage() {
  const { slug = '' } = useParams();
  const { data: gist, isPending, isError, error } = useGist(slug);

  if (isPending) {
    return <p>Loading…</p>;
  }
  if (isError) {
    return <p>{error.isNotFound ? 'That gist does not exist, or is not yours.' : error.message}</p>;
  }

  return (
    <main>
      <h1 className="text-xl font-semibold">{gist.title}</h1>
      {gist.description ? <p className="mt-1">{gist.description}</p> : null}
      <p className="mt-1 text-xs opacity-70">
        {gist.visibility} · {gist.viewCount} views
        {gist.author ? ` · ${gist.author.handle}` : ''}
      </p>

      <div className="mt-8 space-y-8">
        {gist.files.map((file) => (
          <GistFile key={file.filename} file={file} />
        ))}
      </div>
    </main>
  );
}

type GistFilePropsType = {
  file: GistFileType;
};

/**
 * Renders one file.
 *
 * The HTML comes from the API, which produced it with goldmark or chroma and then
 * passed it through bluemonday's allowlist sanitizer. Injecting it here is the
 * point of rendering on the server: the browser downloads no highlighter at all.
 */
function GistFile({ file }: GistFilePropsType) {
  return (
    <section>
      <header className="mb-2 flex items-baseline justify-between gap-4 text-sm">
        <span className="font-mono">{file.filename}</span>
        <a href={file.rawUrl} className="underline">
          raw
        </a>
      </header>

      {file.kind === 'binary' ? (
        <p className="text-sm">
          Uploaded file, {file.byteSize} bytes.
          {file.blobExpiresAt
            ? ` Kept until ${new Date(file.blobExpiresAt).toLocaleDateString()}.`
            : ''}
        </p>
      ) : file.html ? (
        <div className="gist-prose" dangerouslySetInnerHTML={{ __html: file.html }} />
      ) : (
        <pre className="overflow-x-auto rounded border p-3 text-sm">{file.content}</pre>
      )}
    </section>
  );
}
