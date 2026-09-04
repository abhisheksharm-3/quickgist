/** Classifying a file chosen from disk into something a gist can hold. */

/**
 * The two size ceilings the API enforces, repeated here so a file that cannot be
 * accepted is refused before it is sent rather than after.
 *
 * A text file is stored in Postgres and capped at 1 MiB; anything else goes to the
 * bucket, which stops at 10 MiB.
 */
export const MAX_TEXT_BYTES = 1 << 20;
const MAX_UPLOAD_BYTES = 10 << 20;

export type AttachmentType =
  | { kind: 'text'; filename: string; content: string }
  | { kind: 'binary'; filename: string; file: File }
  | { kind: 'rejected'; filename: string; reason: string };

/**
 * Reads one file and decides what it is.
 *
 * The test is whether the bytes are valid UTF-8 with no NUL in them, rather than the
 * extension or the browser's guess at a MIME type: a Go source file arrives as
 * `application/octet-stream` and a file with no extension carries nothing to guess
 * from, so both of those answers are wrong in the cases that matter here.
 */
export async function readAttachment(file: File, canUpload: boolean): Promise<AttachmentType> {
  const filename = file.name || 'untitled';

  if (file.size > MAX_UPLOAD_BYTES) {
    return { kind: 'rejected', filename, reason: 'larger than 10 MB' };
  }

  const text = file.size <= MAX_TEXT_BYTES ? await decodeText(file) : null;
  if (text !== null) {
    return { kind: 'text', filename, content: text };
  }

  if (!canUpload) {
    return { kind: 'rejected', filename, reason: 'sign in to attach a file that is not text' };
  }
  return { kind: 'binary', filename, file };
}

/** The decoded text, or null when the bytes are not text at all. */
async function decodeText(file: File): Promise<string | null> {
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
    return text.includes('\x00') ? null : text;
  } catch {
    return null;
  }
}
