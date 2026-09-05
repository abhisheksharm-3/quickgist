/**
 * Debounces `POST /v1/preview` for the active draft file.
 *
 * A failed request, including a 429, never clears the last good HTML: the
 * caller gets `isStale` instead, matching the spec's "preview never blocks the
 * source" rule. Preview is anonymous, so this bypasses the authenticated
 * `apiRequest` helper rather than carrying a session token nobody checks.
 */
import { useEffect, useState } from 'react';
import { DEFAULT_DEBOUNCE_MS, DEFAULT_RETRY_AFTER_SECONDS } from '@/constants/editor';
import { API_BASE_URL } from '@/constants/env';
import type {
  DraftFileType,
  PreviewRequestType,
  PreviewResponseType,
  PreviewStatusType,
  UsePreviewResultType,
} from '@/types/editor';
import { PreviewResponseSchema } from '@/types/editor';

class PreviewRateLimitedError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super('Preview rate limited');
    this.name = 'PreviewRateLimitedError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function usePreview(
  file: DraftFileType,
  debounceMs: number = DEFAULT_DEBOUNCE_MS,
): UsePreviewResultType {
  const [html, setHtml] = useState<string | null>(null);
  const [status, setStatus] = useState<PreviewStatusType>('idle');
  const [isStale, setIsStale] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (file.content.trim().length === 0) {
      setHtml(null);
      setStatus('idle');
      setIsStale(false);
      setRetryAfterSeconds(null);
      return;
    }

    setStatus('pending');
    const controller = new AbortController();

    const timer = setTimeout(() => {
      requestPreview(
        { filename: file.filename, language: file.language, content: file.content },
        controller.signal,
      )
        .then((result) => {
          setHtml(result.html);
          setStatus('success');
          setIsStale(false);
          setRetryAfterSeconds(null);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setStatus('error');
          setIsStale(true);
          setRetryAfterSeconds(
            error instanceof PreviewRateLimitedError ? error.retryAfterSeconds : null,
          );
        });
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [file.filename, file.language, file.content, debounceMs]);

  return { html, status, isStale, retryAfterSeconds };
}

async function requestPreview(
  input: PreviewRequestType,
  signal: AbortSignal,
): Promise<PreviewResponseType> {
  const response = await fetch(`${API_BASE_URL}/v1/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  });

  if (response.status === 429) {
    throw new PreviewRateLimitedError(parseRetryAfter(response.headers.get('Retry-After')));
  }
  if (!response.ok) {
    throw new Error(`Preview failed with status ${response.status}`);
  }

  return PreviewResponseSchema.parse(await response.json());
}

function parseRetryAfter(headerValue: string | null): number {
  const seconds = headerValue ? Number(headerValue) : Number.NaN;
  return Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_RETRY_AFTER_SECONDS;
}
