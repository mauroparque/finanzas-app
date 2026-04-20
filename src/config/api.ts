/**
 * PostgREST API Client
 *
 * Base URL is configured via VITE_API_URL env var.
 * All write operations use `Prefer: return=representation`
 * so PostgREST returns the created/updated record.
 */

const BASE_URL = import.meta.env.VITE_API_URL as string;

if (import.meta.env.DEV && !BASE_URL) {
  console.warn(
    '[api] VITE_API_URL is not set. ' +
    'Create a .env.local file with VITE_API_URL=https://your-postgrest-endpoint'
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  /** PostgREST horizontal filter params (e.g. { activo: 'eq.true' }) */
  params?: Record<string, string>;
  /** Request body for POST/PATCH */
  body?: unknown;
  /** Additional headers */
  headers?: Record<string, string>;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);

  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    // Ask PostgREST to return the affected rows
    Prefer: 'return=representation',
    ...options.headers,
  };

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`[api] ${method} ${path} → ${res.status}: ${text}`);
  }

  // 204 No Content (e.g. DELETE without Prefer header)
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

// ─── Public CRUD helpers ──────────────────────────────────────────────────────

/**
 * GET /table?params
 * Returns an array of records.
 */
export async function apiGet<T>(
  path: string,
  params?: Record<string, string>
): Promise<T[]> {
  return request<T[]>('GET', path, { params });
}

/**
 * GET /table?id=eq.{id} — returns single record or null
 */
export async function apiGetOne<T>(
  path: string,
  params?: Record<string, string>
): Promise<T | null> {
  const results = await request<T[]>('GET', path, {
    params,
    headers: { Accept: 'application/vnd.pgrst.object+json' },
  }).catch(() => [] as T[]);
  return results[0] ?? null;
}

/**
 * POST /table — creates a record, returns the created record.
 */
export async function apiPost<TInput, TOutput = TInput>(
  path: string,
  body: TInput
): Promise<TOutput> {
  const result = await request<TOutput[]>('POST', path, { body });
  // PostgREST returns array when Prefer: return=representation
  return Array.isArray(result) ? result[0] : result;
}

/**
 * PATCH /table?filter — updates matching records, returns updated rows.
 */
export async function apiPatch<TInput, TOutput = TInput>(
  path: string,
  params: Record<string, string>,
  body: Partial<TInput>
): Promise<TOutput[]> {
  return request<TOutput[]>('PATCH', path, { params, body });
}

/**
 * DELETE /table?filter — deletes matching records.
 */
export async function apiDelete(
  path: string,
  params: Record<string, string>
): Promise<void> {
  await request<void>('DELETE', path, { params });
}
