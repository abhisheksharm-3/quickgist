/**
 * The HTTP client for the quickgist API.
 *
 * Every response is validated against a schema and every failure becomes an
 * ApiError carrying the code the server chose. The previous client threw
 * `new Error('API Error: 500')`, discarding the structured `{code, message}` the
 * backend builds, so every message a user saw was a bare status number.
 */
import type { z } from 'zod';
import { auth } from '@/lib/supabase-client';
import { ApiErrorSchema } from '@/schemas';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/** An error the API reported, with the machine-readable code intact. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }

  /** Whether the caller needs to sign in for this request to succeed. */
  get isUnauthenticated(): boolean {
    return this.status === 401;
  }

  /** Whether the gist is missing, or private to somebody else. */
  get isNotFound(): boolean {
    return this.status === 404;
  }
}

type RequestOptionsType = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
};

/**
 * Sends a request and validates the response against `schema`.
 *
 * Throws ApiError for any non-2xx response, and a ZodError when the body does not
 * match the schema.
 */
export async function apiRequest<SchemaType extends z.ZodType>(
  path: string,
  schema: SchemaType,
  options: RequestOptionsType = {},
): Promise<z.infer<SchemaType>> {
  const response = await sendRequest(path, options);

  if (!response.ok) {
    throw await toApiError(response);
  }

  return schema.parse(await response.json());
}

/** Sends a multipart upload, which needs no JSON content type of its own. */
export async function apiUpload<SchemaType extends z.ZodType>(
  path: string,
  schema: SchemaType,
  form: FormData,
): Promise<z.infer<SchemaType>> {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    body: form,
    headers: await authHeaders(),
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  return schema.parse(await response.json());
}

async function sendRequest(path: string, options: RequestOptionsType): Promise<Response> {
  const headers = await authHeaders();
  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers,
  };

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    init.body = JSON.stringify(options.body);
  }
  if (options.signal) {
    init.signal = options.signal;
  }

  return fetch(buildUrl(path, options.query), init);
}

/**
 * Attaches the current access token when there is a session.
 *
 * The token is read per request rather than cached, because Supabase refreshes it
 * in the background and a cached one would start failing after an hour.
 */
async function authHeaders(): Promise<Headers> {
  const headers = new Headers();

  if (!auth) {
    return headers;
  }

  const { data } = await auth.getSession();
  if (data.session?.access_token) {
    headers.set('Authorization', `Bearer ${data.session.access_token}`);
  }

  return headers;
}

function buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
  const url = `${API_BASE_URL}${path}`;

  if (!query) {
    return url;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }

  const search = params.toString();
  return search ? `${url}?${search}` : url;
}

/**
 * Reads the server's error shape, falling back to the status text for a response
 * that is not JSON at all, such as one a proxy generated.
 */
async function toApiError(response: Response): Promise<ApiError> {
  try {
    const parsed = ApiErrorSchema.parse(await response.json());
    return new ApiError(response.status, parsed.error.code, parsed.error.message);
  } catch {
    return new ApiError(response.status, 'unknown', response.statusText || 'Request failed');
  }
}
