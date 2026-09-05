/** Proves the preview hook debounces and survives a failed request. */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePreview } from '@/hooks/usePreview';
import type { DraftFileType } from '@/types/editor';

function fileWithContent(content: string): DraftFileType {
  return { id: 'file-1', filename: 'README.md', language: null, content };
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

describe('usePreview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('debounces rapid keystrokes into a single request', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ kind: 'markdown', html: '<h1>hi</h1>' }));

    const { rerender } = renderHook(({ file }) => usePreview(file), {
      initialProps: { file: fileWithContent('h') },
    });

    rerender({ file: fileWithContent('he') });
    rerender({ file: fileWithContent('hel') });
    rerender({ file: fileWithContent('hell') });
    rerender({ file: fileWithContent('hello') });

    expect(fetchMock).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(400));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.content).toBe('hello');
  });

  it('keeps the last good HTML and reports staleness when a request fails', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ kind: 'markdown', html: '<h1>good</h1>' }));

    const { result, rerender } = renderHook(({ file }) => usePreview(file), {
      initialProps: { file: fileWithContent('good') },
    });

    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(result.current.status).toBe('success');
    expect(result.current.html).toBe('<h1>good</h1>');

    fetchMock.mockResolvedValueOnce(
      new Response('rate limited', { status: 429, headers: { 'Retry-After': '30' } }),
    );

    rerender({ file: fileWithContent('good, then a change') });
    await act(() => vi.advanceTimersByTimeAsync(400));

    expect(result.current.status).toBe('error');
    expect(result.current.html).toBe('<h1>good</h1>');
    expect(result.current.isStale).toBe(true);
    expect(result.current.retryAfterSeconds).toBe(30);
  });
});
