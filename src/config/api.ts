/**
 * Supabase REST (PostgREST) client.
 * - Uses VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (see src/config/supabase.ts).
 * - Injects apikey + Authorization on every request.
 * - On 401, attempts a refresh once and retries the request.
 */

import { REST_BASE, SUPABASE_PUBLISHABLE_KEY } from './supabase';
import { useAuthStore } from '../store/authStore';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  params?: Record<string, string>;
  body?: unknown;
  headers?: Record<string, string>;
}

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  const session = useAuthStore.getState().session;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Prefer: 'return=representation',
      apikey: SUPABASE_PUBLISHABLE_KEY,
    ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
    ...extra,
  };
  return headers;
}

async function rawRequest<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions
): Promise<{ ok: boolean; status: number; data: T | undefined; text: string }> {
  const url = new URL(`${REST_BASE}${path}`);
  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    method,
    headers: buildHeaders(options.headers),
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 204) {
    return { ok: res.ok, status: res.status, data: undefined, text: '' };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return { ok: false, status: res.status, data: undefined, text };
  }
  const data = (await res.json()) as T;
  return { ok: true, status: res.status, data, text: '' };
}

async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  let attempt = await rawRequest<T>(method, path, options);

  if (attempt.status === 401) {
    const fresh = await useAuthStore.getState().refresh();
    if (fresh) {
      attempt = await rawRequest<T>(method, path, options);
    }
  }

  if (!attempt.ok) {
    throw new Error(`[api] ${method} ${path} → ${attempt.status}: ${attempt.text}`);
  }
  return attempt.data as T;
}

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T[]> {
  return request<T[]>('GET', path, { params });
}

export async function apiGetOne<T>(
  path: string,
  params?: Record<string, string>
): Promise<T | null> {
  try {
    // PostgREST returns a single JSON object for object+json, not an array
    const result = await request<T>('GET', path, {
      params,
      headers: { Accept: 'application/vnd.pgrst.object+json' },
    });
    return result ?? null;
  } catch (err) {
    // PostgREST returns 406 (not 404) for zero rows with object+json Accept header
    if (err instanceof Error && (err.message.includes('404') || err.message.includes('406'))) {
      return null;
    }
    throw err;
  }
}

export async function apiPost<TInput, TOutput = TInput>(
  path: string,
  body: TInput
): Promise<TOutput> {
  const result = await request<TOutput[]>('POST', path, { body });
  return Array.isArray(result) ? result[0] : (result as TOutput);
}

export async function apiPatch<TInput, TOutput = TInput>(
  path: string,
  params: Record<string, string>,
  body: Partial<TInput>
): Promise<TOutput[]> {
  return request<TOutput[]>('PATCH', path, { params, body });
}

export async function apiDelete(path: string, params: Record<string, string>): Promise<void> {
  await request<void>('DELETE', path, { params });
}
