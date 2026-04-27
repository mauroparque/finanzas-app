# Supabase Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar el backend de Finanzas 2.0 desde PostgreSQL+PostgREST en VPS (acceso vía Tailscale) hacia Supabase free tier, agregando auth real (email+password) y RLS compartido, sin downtime planificado y con rollback < 5 minutos.

**Architecture:** Supabase aloja PostgreSQL, PostgREST y Auth bajo `https://<proyecto>.supabase.co`. El frontend obtiene un JWT vía `/auth/v1/token` y lo envía en cada request a `/rest/v1/...` junto con el `apikey` (anon). El VPS conserva n8n y el bot de Telegram, que pegan a Supabase con `service_role key`. Tras 7 días estables, PostgREST y Tailscale se decomisionan.

**Tech Stack:** React 19 + TypeScript + Vite + Zustand 5 + Tailwind + Vitest + Supabase (PostgreSQL 15 + PostgREST + GoTrue Auth). Sin SDK de Supabase (`@supabase/supabase-js`) en esta migración — se usa `fetch` crudo extendido.

**Spec de referencia:** `docs/spec/2026-04-27-supabase-migration-design.md`

---

## File Structure

### Archivos a crear

| Path | Responsabilidad |
| ---- | --------------- |
| `src/config/supabase.ts` | Lee `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Único punto de configuración. |
| `src/lib/supabaseAuth.ts` | Funciones puras `signIn`, `refreshSession`, `signOut` contra `/auth/v1/*`. |
| `src/lib/supabaseAuth.test.ts` | Cobertura de los 3 flujos. |
| `src/store/authStore.ts` | Zustand store con `session`, `signIn`, `signOut`, `refresh`, persistencia en `localStorage`. |
| `src/store/authStore.test.ts` | Cobertura del store. |
| `src/components/auth/LoginScreen.tsx` | Form email + password. |
| `src/components/auth/LoginScreen.test.tsx` | Happy path + error path. |
| `supabase/migrations/003_enable_rls.sql` | Activa RLS y crea policies en todas las tablas operativas. |
| `scripts/migrate-to-supabase.sh` | Runbook ejecutable: dump VPS, restore Supabase, verifica conteos. |

### Archivos a modificar

| Path | Cambio |
| ---- | ------ |
| `src/config/api.ts` | Lee URL y key desde `src/config/supabase.ts`. Inyecta headers `apikey` + `Authorization: Bearer <jwt>`. Interceptor 401 con refresh. |
| `src/config/api.test.ts` | Tests adicionales: headers, 401 refresh, 401 sin sesión → throw. |
| `src/App.tsx` | Render condicional `LoginScreen` vs app. Botón logout en `Sidebar` (mínimo). |
| `.env.local` | Agregar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Mantener `VITE_API_URL` durante el hand-over y luego eliminar. |
| `docs/PROJECT_TRACKING.md` | Cerrar hallazgo D1 al finalizar Fase C. |

---

## Phase A — Frontend infrastructure (rama feature, sin desplegar)

### Task A1: Configuración de Supabase

**Files:**
- Create: `src/config/supabase.ts`
- Modify: `.env.local` (local), agregar plantilla en `README.md` si existe sección de env vars

- [ ] **Step 1: Agregar variables a `.env.local`**

```bash
# Supabase (rellenar tras Task B1)
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder-anon-key
```

- [ ] **Step 2: Crear `src/config/supabase.ts`**

```typescript
/**
 * Supabase configuration
 * Single source of truth for the project URL and anon key.
 */

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (import.meta.env.DEV) {
  if (!SUPABASE_URL) {
    console.warn('[supabase] VITE_SUPABASE_URL is not set');
  }
  if (!SUPABASE_ANON_KEY) {
    console.warn('[supabase] VITE_SUPABASE_ANON_KEY is not set');
  }
}

export const REST_BASE = `${SUPABASE_URL}/rest/v1`;
export const AUTH_BASE = `${SUPABASE_URL}/auth/v1`;
```

- [ ] **Step 3: Verificar tipado**

Run: `npx tsc --noEmit`
Expected: PASS sin errores nuevos.

- [ ] **Step 4: Commit**

```bash
git add src/config/supabase.ts .env.local
git commit -m "feat(api): add supabase config module"
```

---

### Task A2: Helpers de auth (TDD)

**Files:**
- Create: `src/lib/supabaseAuth.ts`
- Create: `src/lib/supabaseAuth.test.ts`

- [ ] **Step 1: Definir tipos del response de Supabase Auth**

Crear `src/lib/supabaseAuth.ts` con solo los tipos:

```typescript
import { AUTH_BASE, SUPABASE_ANON_KEY } from '../config/supabase';

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix seconds
  token_type: 'bearer';
  user: { id: string; email: string };
}

export interface SignInError {
  error: string;
  error_description?: string;
}
```

- [ ] **Step 2: Escribir tests fallando para `signIn`**

```typescript
// src/lib/supabaseAuth.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signIn, refreshSession, signOut } from './supabaseAuth';

describe('supabaseAuth', () => {
  beforeEach(() => {
    import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
    import.meta.env.VITE_SUPABASE_ANON_KEY = 'anon-key';
  });

  afterEach(() => vi.restoreAllMocks());

  describe('signIn', () => {
    it('returns session on success', async () => {
      const session = {
        access_token: 'jwt',
        refresh_token: 'rt',
        expires_in: 3600,
        token_type: 'bearer',
        user: { id: 'u1', email: 'a@b.com' },
      };
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(session),
      }) as never;

      const result = await signIn('a@b.com', 'pw');

      expect(result.access_token).toBe('jwt');
      expect(result.expires_at).toBeGreaterThan(Math.floor(Date.now() / 1000));
      expect(result.user.email).toBe('a@b.com');
    });

    it('throws on auth failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'invalid_grant' }),
      }) as never;

      await expect(signIn('a@b.com', 'wrong')).rejects.toThrow('invalid_grant');
    });

    it('posts to /auth/v1/token?grant_type=password with apikey header', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          access_token: 'jwt', refresh_token: 'rt', expires_in: 3600,
          token_type: 'bearer', user: { id: 'u', email: 'e' },
        }),
      });
      global.fetch = fetchMock as never;

      await signIn('a@b.com', 'pw');

      const [url, opts] = fetchMock.mock.calls[0];
      expect(url).toContain('/auth/v1/token?grant_type=password');
      expect((opts as RequestInit).method).toBe('POST');
      expect((opts as RequestInit).headers).toMatchObject({
        apikey: 'anon-key',
        'Content-Type': 'application/json',
      });
    });
  });
});
```

- [ ] **Step 3: Run, expect FAIL**

Run: `npm run test:run -- src/lib/supabaseAuth.test.ts`
Expected: FAIL — `signIn is not a function`.

- [ ] **Step 4: Implementar `signIn`**

Agregar a `src/lib/supabaseAuth.ts`:

```typescript
async function authRequest<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${AUTH_BASE}${path}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    const err = json as SignInError;
    throw new Error(err.error_description || err.error || `auth failed (${res.status})`);
  }
  return json as T;
}

export async function signIn(email: string, password: string): Promise<SupabaseSession> {
  const raw = await authRequest<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: 'bearer';
    user: { id: string; email: string };
  }>('/token?grant_type=password', { email, password });

  return {
    access_token: raw.access_token,
    refresh_token: raw.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + raw.expires_in,
    token_type: raw.token_type,
    user: raw.user,
  };
}
```

- [ ] **Step 5: Run, expect PASS para `signIn`**

Run: `npm run test:run -- src/lib/supabaseAuth.test.ts -t signIn`
Expected: PASS.

- [ ] **Step 6: Tests fallando para `refreshSession`**

Append a `src/lib/supabaseAuth.test.ts`:

```typescript
  describe('refreshSession', () => {
    it('exchanges refresh_token for new session', async () => {
      const newSession = {
        access_token: 'jwt2', refresh_token: 'rt2', expires_in: 3600,
        token_type: 'bearer', user: { id: 'u', email: 'e' },
      };
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true, status: 200, json: () => Promise.resolve(newSession),
      });
      global.fetch = fetchMock as never;

      const result = await refreshSession('old-rt');

      expect(result.access_token).toBe('jwt2');
      const [url, opts] = fetchMock.mock.calls[0];
      expect(url).toContain('/auth/v1/token?grant_type=refresh_token');
      expect(JSON.parse((opts as RequestInit).body as string)).toEqual({
        refresh_token: 'old-rt',
      });
    });

    it('throws on expired refresh token', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false, status: 400,
        json: () => Promise.resolve({ error: 'invalid_grant' }),
      }) as never;

      await expect(refreshSession('bad')).rejects.toThrow('invalid_grant');
    });
  });
```

- [ ] **Step 7: Run, expect FAIL**

Run: `npm run test:run -- src/lib/supabaseAuth.test.ts -t refreshSession`
Expected: FAIL.

- [ ] **Step 8: Implementar `refreshSession`**

```typescript
export async function refreshSession(refreshToken: string): Promise<SupabaseSession> {
  const raw = await authRequest<{
    access_token: string; refresh_token: string; expires_in: number;
    token_type: 'bearer'; user: { id: string; email: string };
  }>('/token?grant_type=refresh_token', { refresh_token: refreshToken });

  return {
    access_token: raw.access_token,
    refresh_token: raw.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + raw.expires_in,
    token_type: raw.token_type,
    user: raw.user,
  };
}
```

- [ ] **Step 9: Run, expect PASS**

Run: `npm run test:run -- src/lib/supabaseAuth.test.ts`
Expected: PASS (signIn + refreshSession).

- [ ] **Step 10: Test fallando para `signOut`**

```typescript
  describe('signOut', () => {
    it('posts to /auth/v1/logout with bearer token', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true, status: 204, json: () => Promise.resolve({}),
      });
      global.fetch = fetchMock as never;

      await signOut('jwt');

      const [url, opts] = fetchMock.mock.calls[0];
      expect(url).toContain('/auth/v1/logout');
      expect((opts as RequestInit).headers).toMatchObject({
        apikey: 'anon-key',
        Authorization: 'Bearer jwt',
      });
    });

    it('does not throw if server returns 4xx (idempotent)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false, status: 401, json: () => Promise.resolve({}),
      }) as never;

      await expect(signOut('expired')).resolves.toBeUndefined();
    });
  });
```

- [ ] **Step 11: Implementar `signOut`**

```typescript
export async function signOut(accessToken: string): Promise<void> {
  try {
    await fetch(`${AUTH_BASE}/logout`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch {
    // logout is best-effort; the local session is wiped regardless
  }
}
```

- [ ] **Step 12: Run, expect PASS**

Run: `npm run test:run -- src/lib/supabaseAuth.test.ts`
Expected: PASS (3 describes, todos verdes).

- [ ] **Step 13: Commit**

```bash
git add src/lib/supabaseAuth.ts src/lib/supabaseAuth.test.ts
git commit -m "feat(auth): add supabase auth helpers (signIn, refresh, signOut)"
```

---

### Task A3: Auth store con persistencia (TDD)

**Files:**
- Create: `src/store/authStore.ts`
- Create: `src/store/authStore.test.ts`

- [ ] **Step 1: Tests fallando**

```typescript
// src/store/authStore.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAuthStore } from './authStore';
import * as auth from '../lib/supabaseAuth';

const session = {
  access_token: 'jwt',
  refresh_token: 'rt',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer' as const,
  user: { id: 'u1', email: 'a@b.com' },
};

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ session: null, status: 'idle', error: null });
  });

  afterEach(() => vi.restoreAllMocks());

  it('starts with no session', () => {
    const state = useAuthStore.getState();
    expect(state.session).toBeNull();
    expect(state.status).toBe('idle');
  });

  it('signIn stores session and persists to localStorage', async () => {
    vi.spyOn(auth, 'signIn').mockResolvedValue(session);

    await useAuthStore.getState().signIn('a@b.com', 'pw');

    expect(useAuthStore.getState().session).toEqual(session);
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(JSON.parse(localStorage.getItem('finanzas-auth')!).session.access_token).toBe('jwt');
  });

  it('signIn surfaces error and clears session', async () => {
    vi.spyOn(auth, 'signIn').mockRejectedValue(new Error('invalid_grant'));

    await expect(useAuthStore.getState().signIn('x', 'y')).rejects.toThrow('invalid_grant');

    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().error).toBe('invalid_grant');
  });

  it('signOut clears session and localStorage', async () => {
    useAuthStore.setState({ session, status: 'authenticated' });
    localStorage.setItem('finanzas-auth', JSON.stringify({ session }));
    vi.spyOn(auth, 'signOut').mockResolvedValue();

    await useAuthStore.getState().signOut();

    expect(useAuthStore.getState().session).toBeNull();
    expect(localStorage.getItem('finanzas-auth')).toBeNull();
  });

  it('hydrate loads session from localStorage', () => {
    localStorage.setItem('finanzas-auth', JSON.stringify({ session }));

    useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().session?.access_token).toBe('jwt');
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('hydrate ignores expired sessions', () => {
    const expired = { ...session, expires_at: Math.floor(Date.now() / 1000) - 10 };
    localStorage.setItem('finanzas-auth', JSON.stringify({ session: expired }));

    useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().session).toBeNull();
  });

  it('refresh updates session in store and localStorage', async () => {
    useAuthStore.setState({ session, status: 'authenticated' });
    const fresh = { ...session, access_token: 'jwt2' };
    vi.spyOn(auth, 'refreshSession').mockResolvedValue(fresh);

    const result = await useAuthStore.getState().refresh();

    expect(result?.access_token).toBe('jwt2');
    expect(useAuthStore.getState().session?.access_token).toBe('jwt2');
  });

  it('refresh returns null and clears session if refresh fails', async () => {
    useAuthStore.setState({ session, status: 'authenticated' });
    vi.spyOn(auth, 'refreshSession').mockRejectedValue(new Error('invalid_grant'));

    const result = await useAuthStore.getState().refresh();

    expect(result).toBeNull();
    expect(useAuthStore.getState().session).toBeNull();
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npm run test:run -- src/store/authStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implementar el store**

```typescript
// src/store/authStore.ts
import { create } from 'zustand';
import * as auth from '../lib/supabaseAuth';
import type { SupabaseSession } from '../lib/supabaseAuth';

const STORAGE_KEY = 'finanzas-auth';

type Status = 'idle' | 'loading' | 'authenticated' | 'error';

interface AuthState {
  session: SupabaseSession | null;
  status: Status;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<SupabaseSession | null>;
  hydrate: () => void;
}

const persist = (session: SupabaseSession | null) => {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ session }));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  status: 'idle',
  error: null,

  signIn: async (email, password) => {
    set({ status: 'loading', error: null });
    try {
      const session = await auth.signIn(email, password);
      persist(session);
      set({ session, status: 'authenticated', error: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'sign-in failed';
      persist(null);
      set({ session: null, status: 'error', error: message });
      throw e;
    }
  },

  signOut: async () => {
    const current = get().session;
    if (current) {
      await auth.signOut(current.access_token);
    }
    persist(null);
    set({ session: null, status: 'idle', error: null });
  },

  refresh: async () => {
    const current = get().session;
    if (!current) return null;
    try {
      const fresh = await auth.refreshSession(current.refresh_token);
      persist(fresh);
      set({ session: fresh, status: 'authenticated', error: null });
      return fresh;
    } catch {
      persist(null);
      set({ session: null, status: 'idle', error: null });
      return null;
    }
  },

  hydrate: () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { session: SupabaseSession };
      const now = Math.floor(Date.now() / 1000);
      if (parsed.session.expires_at > now) {
        set({ session: parsed.session, status: 'authenticated' });
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
}));
```

- [ ] **Step 4: Run, expect PASS**

Run: `npm run test:run -- src/store/authStore.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/store/authStore.ts src/store/authStore.test.ts
git commit -m "feat(auth): add zustand auth store with localStorage persistence"
```

---

### Task A4: Adaptar `api.ts` con headers de auth y refresh interceptor (TDD)

**Files:**
- Modify: `src/config/api.ts`
- Modify: `src/config/api.test.ts`

- [ ] **Step 1: Tests fallando para headers de auth**

Append a `src/config/api.test.ts`:

```typescript
import { useAuthStore } from '../store/authStore';

describe('auth headers', () => {
  beforeEach(() => {
    import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
    import.meta.env.VITE_SUPABASE_ANON_KEY = 'anon-key';
    useAuthStore.setState({
      session: {
        access_token: 'jwt-1',
        refresh_token: 'rt-1',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: { id: 'u', email: 'e' },
      },
      status: 'authenticated',
      error: null,
    });
  });

  afterEach(() => {
    useAuthStore.setState({ session: null, status: 'idle', error: null });
  });

  it('sends apikey and Authorization Bearer on every request', async () => {
    mockFetch([{ id: 1 }]);
    await apiGet('/movimientos');
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1].headers).toMatchObject({
      apikey: 'anon-key',
      Authorization: 'Bearer jwt-1',
    });
  });

  it('omits Authorization when no session (anon access still gets apikey)', async () => {
    useAuthStore.setState({ session: null, status: 'idle', error: null });
    mockFetch([{ id: 1 }]);
    await apiGet('/movimientos');
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1].headers).toMatchObject({ apikey: 'anon-key' });
    expect(call[1].headers).not.toHaveProperty('Authorization');
  });

  it('builds URL against /rest/v1 base', async () => {
    mockFetch([]);
    await apiGet('/movimientos');
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toContain('https://test.supabase.co/rest/v1/movimientos');
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npm run test:run -- src/config/api.test.ts -t "auth headers"`
Expected: FAIL — apikey header missing.

- [ ] **Step 3: Refactor `api.ts` para usar config Supabase + headers**

Reemplazar el archivo completo:

```typescript
/**
 * Supabase REST (PostgREST) client.
 * - Uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see src/config/supabase.ts).
 * - Injects apikey + Authorization on every request.
 * - On 401, attempts a refresh once and retries the request.
 */

import { REST_BASE, SUPABASE_ANON_KEY } from './supabase';
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
    apikey: SUPABASE_ANON_KEY,
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
  const results = await request<T[]>('GET', path, {
    params,
    headers: { Accept: 'application/vnd.pgrst.object+json' },
  }).catch(() => [] as T[]);
  return results[0] ?? null;
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
```

- [ ] **Step 4: Actualizar tests existentes que asumían `VITE_API_URL`**

En `src/config/api.test.ts`, reemplazar el `beforeEach` global:

```typescript
beforeEach(() => {
  import.meta.env.VITE_SUPABASE_URL = 'https://api.test.com';
  import.meta.env.VITE_SUPABASE_ANON_KEY = 'anon-key';
});
```

Ajustar los asserts que esperaban URLs sin `/rest/v1` — ahora deben matchear `https://api.test.com/rest/v1/...`.

- [ ] **Step 5: Run, expect PASS**

Run: `npm run test:run -- src/config/api.test.ts`
Expected: PASS (todos los CRUD + 3 nuevos de auth headers).

- [ ] **Step 6: Tests fallando para 401 refresh interceptor**

```typescript
describe('401 refresh interceptor', () => {
  beforeEach(() => {
    import.meta.env.VITE_SUPABASE_URL = 'https://api.test.com';
    import.meta.env.VITE_SUPABASE_ANON_KEY = 'anon-key';
    useAuthStore.setState({
      session: {
        access_token: 'old',
        refresh_token: 'rt',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: { id: 'u', email: 'e' },
      },
      status: 'authenticated', error: null,
    });
  });

  it('refreshes token on 401 and retries the request', async () => {
    const fresh = {
      access_token: 'new', refresh_token: 'rt2',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer' as const, user: { id: 'u', email: 'e' },
    };
    vi.spyOn(useAuthStore.getState(), 'refresh').mockImplementation(async () => {
      useAuthStore.setState({ session: fresh, status: 'authenticated' });
      return fresh;
    });

    let call = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      call += 1;
      if (call === 1) {
        return Promise.resolve({
          ok: false, status: 401,
          text: () => Promise.resolve('JWT expired'),
          json: () => Promise.resolve({}),
        });
      }
      return Promise.resolve({
        ok: true, status: 200,
        json: () => Promise.resolve([{ id: 1 }]),
        text: () => Promise.resolve(''),
      });
    }) as never;

    const result = await apiGet<{ id: number }>('/movimientos');

    expect(result).toEqual([{ id: 1 }]);
    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(2);
    expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].headers.Authorization).toBe('Bearer new');
  });

  it('throws if refresh fails', async () => {
    vi.spyOn(useAuthStore.getState(), 'refresh').mockResolvedValue(null);
    global.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 401,
      text: () => Promise.resolve('JWT expired'),
      json: () => Promise.resolve({}),
    }) as never;

    await expect(apiGet('/movimientos')).rejects.toThrow('401');
  });
});
```

- [ ] **Step 7: Run, expect PASS**

Run: `npm run test:run -- src/config/api.test.ts -t "401"`
Expected: PASS — la lógica de refresh ya está en el código del Step 3.

- [ ] **Step 8: Verificar suite completa**

Run: `npm run test:run`
Expected: PASS — toda la batería verde.

- [ ] **Step 9: Commit**

```bash
git add src/config/api.ts src/config/api.test.ts
git commit -m "feat(api): switch to supabase REST base with auth headers and 401 refresh"
```

---

### Task A5: LoginScreen component (TDD con RTL)

**Files:**
- Create: `src/components/auth/LoginScreen.tsx`
- Create: `src/components/auth/LoginScreen.test.tsx`

- [ ] **Step 1: Tests fallando**

```typescript
// src/components/auth/LoginScreen.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginScreen } from './LoginScreen';
import { useAuthStore } from '../../store/authStore';

describe('LoginScreen', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, status: 'idle', error: null });
  });
  afterEach(() => vi.restoreAllMocks());

  it('renders email and password inputs and submit button', () => {
    render(<LoginScreen />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
  });

  it('calls signIn with form values on submit', async () => {
    const signIn = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ signIn } as never);

    render(<LoginScreen />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'pw123' } });
    fireEvent.click(screen.getByRole('button', { name: /ingresar/i }));

    await waitFor(() => expect(signIn).toHaveBeenCalledWith('a@b.com', 'pw123'));
  });

  it('renders error from store', () => {
    useAuthStore.setState({ session: null, status: 'error', error: 'Credenciales inválidas' });
    render(<LoginScreen />);
    expect(screen.getByText(/credenciales inválidas/i)).toBeInTheDocument();
  });

  it('disables submit button while loading', () => {
    useAuthStore.setState({ session: null, status: 'loading', error: null });
    render(<LoginScreen />);
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npm run test:run -- src/components/auth/LoginScreen.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implementar `LoginScreen`**

```typescript
// src/components/auth/LoginScreen.tsx
import { useState, FormEvent } from 'react';
import { useAuthStore } from '../../store/authStore';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const status = useAuthStore(s => s.status);
  const error = useAuthStore(s => s.error);
  const signIn = useAuthStore(s => s.signIn);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
    } catch {
      // error stays in store
    }
  };

  const isLoading = status === 'loading';

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-6 rounded-3xl border border-stone-200 bg-white p-8 shadow-sm"
      >
        <h1 className="font-serif text-2xl text-stone-800">Finanzas 2.0</h1>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm text-stone-600">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full rounded-2xl border border-stone-200 px-4 py-2 focus:border-terracotta-400 focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm text-stone-600">Contraseña</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full rounded-2xl border border-stone-200 px-4 py-2 focus:border-terracotta-400 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-terracotta-500 py-2 text-white shadow-sm hover:bg-terracotta-600 disabled:opacity-50"
        >
          {isLoading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
};
```

- [ ] **Step 4: Run, expect PASS**

Run: `npm run test:run -- src/components/auth/LoginScreen.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/LoginScreen.tsx src/components/auth/LoginScreen.test.tsx
git commit -m "feat(auth): add LoginScreen component"
```

---

### Task A6: Gate en `App.tsx` y logout

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/common/Layout/Sidebar.tsx` (botón logout)

- [ ] **Step 1: Hidratar sesión al iniciar la app**

En `src/App.tsx`, agregar al inicio del componente:

```typescript
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { LoginScreen } from './components/auth/LoginScreen';
```

Y dentro de `App`:

```typescript
const session = useAuthStore(s => s.session);
const hydrate = useAuthStore(s => s.hydrate);

useEffect(() => {
  hydrate();
}, [hydrate]);

if (!session) {
  return <LoginScreen />;
}
```

Insertar el bloque antes del `return` actual (después de la lectura de `useUIStore`).

- [ ] **Step 2: Agregar botón de logout en Sidebar**

Leer primero `src/components/common/Layout/Sidebar.tsx` para localizar el lugar apropiado (típicamente al pie del sidebar). Inyectar:

```typescript
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
```

Al final de la lista de items del sidebar:

```typescript
<button
  onClick={() => useAuthStore.getState().signOut()}
  className="flex items-center gap-2 px-4 py-2 text-sm text-stone-500 hover:text-stone-800"
  aria-label="Cerrar sesión"
>
  <LogOut size={18} />
  <span>Salir</span>
</button>
```

- [ ] **Step 3: Smoke test manual local con Supabase placeholder**

Run: `npm run dev`
Expected: la app abre `LoginScreen`. Como `VITE_SUPABASE_URL` aún apunta a placeholder, el submit fallará — eso es esperado. Verificar que el formulario renderiza.

- [ ] **Step 4: Suite completa verde**

Run: `npm run test:run && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/common/Layout/Sidebar.tsx
git commit -m "feat(auth): gate App behind LoginScreen + add logout button"
```

---

## Phase B — Backend operations (manual + scripts)

### Task B1: Crear proyecto Supabase y provisionar usuarios

**Files:** ninguno (operación externa).

- [ ] **Step 1: Crear cuenta + proyecto Supabase**

Acción manual:
1. Ir a https://supabase.com/dashboard, crear cuenta si no existe (login con GitHub).
2. **New project** — name: `finanzas-app`, region: **South America (São Paulo)** si está disponible, sino **East US (North Virginia)**, plan: **Free**.
3. Generar y guardar el password del proyecto (database password). Va a `1Password`/manager.
4. Esperar provisioning (~2 min).

- [ ] **Step 2: Capturar credenciales**

En el dashboard del proyecto, **Settings → API**, copiar:
- `Project URL` → `VITE_SUPABASE_URL`
- `anon public` key → `VITE_SUPABASE_ANON_KEY`
- `service_role secret` key → guardar para n8n (no va al frontend).

Actualizar `.env.local`:

```bash
VITE_SUPABASE_URL=https://<proyecto-id>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhb...
```

- [ ] **Step 3: Crear los dos usuarios**

Dashboard → **Authentication → Users → Add user → Create new user**:
- `mau@<email>` — password robusto.
- `agos@<email>` — password robusto, comunicar a Agos.
- Marcar **Auto Confirm User** en ambos.

- [ ] **Step 4: Deshabilitar signup público**

Dashboard → **Authentication → Providers → Email**:
- **Enable Email Signup**: OFF
- **Confirm email**: OFF (los usuarios ya están confirmados manualmente)

---

### Task B2: Migración del schema

**Files:**
- Create: `scripts/migrate-to-supabase.sh`

- [ ] **Step 1: Crear script de dump**

```bash
# scripts/migrate-to-supabase.sh
#!/usr/bin/env bash
set -euo pipefail

# Requires VPS_PG_URL and SUPABASE_DB_URL env vars.
# VPS_PG_URL example:   postgres://user:pw@vps.tail.../finanzas
# SUPABASE_DB_URL:      postgres://postgres.<ref>:<pw>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres

: "${VPS_PG_URL:?Set VPS_PG_URL}"
: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL}"

OUTDIR=$(mktemp -d)
echo "Working dir: $OUTDIR"

echo "→ Dumping schema..."
pg_dump --schema-only --no-owner --no-privileges \
  --schema=public \
  "$VPS_PG_URL" > "$OUTDIR/schema.sql"

echo "→ Dumping data..."
pg_dump --data-only --inserts --no-owner --no-privileges \
  --schema=public \
  "$VPS_PG_URL" > "$OUTDIR/data.sql"

echo "→ Schema dump at $OUTDIR/schema.sql"
echo "→ Data dump at $OUTDIR/data.sql"
echo "Inspect both files manually before applying."
echo
echo "To apply schema: psql \"\$SUPABASE_DB_URL\" -f $OUTDIR/schema.sql"
echo "To apply data:   psql \"\$SUPABASE_DB_URL\" -f $OUTDIR/data.sql"
```

```bash
chmod +x scripts/migrate-to-supabase.sh
```

- [ ] **Step 2: Ejecutar dump**

```bash
export VPS_PG_URL="postgres://<usuario>:<pw>@<host>:<port>/finanzas"
export SUPABASE_DB_URL="postgres://postgres.<ref>:<db-password>@aws-0-<region>.pooler.supabase.com:5432/postgres"

./scripts/migrate-to-supabase.sh
```

Expected: imprime paths a `schema.sql` y `data.sql`.

- [ ] **Step 3: Auditar `schema.sql`**

Abrir `schema.sql` y eliminar/ajustar:
- Cualquier `CREATE ROLE` o `GRANT TO <rol-vps>` que no exista en Supabase.
- `CREATE EXTENSION` que requieran permisos especiales — Supabase ya tiene `uuid-ossp`, `pgcrypto`, etc. Mantener solo extensiones del schema.
- Verificar que todos los `CREATE TABLE` están dentro del schema `public`.

- [ ] **Step 4: Aplicar schema en Supabase**

```bash
psql "$SUPABASE_DB_URL" -f /tmp/<outdir>/schema.sql
```

Expected: ejecuta sin errores. Si hay errores de grants → comentarlos y volver a correr.

- [ ] **Step 5: Verificar tablas en Supabase**

Dashboard → **Table Editor**: deben aparecer `movimientos`, `medios_pago`, `categorias_maestras`, `bot_sessions`, `chat_histories`, `servicios_definicion`, `ingresos_definicion`, `presupuestos_definicion`, `movimientos_previstos_mes`, `cuotas_tarjeta`, `prestamos`, `cotizaciones_fx`.

- [ ] **Step 6: Commit del script**

```bash
git add scripts/migrate-to-supabase.sh
git commit -m "chore(migration): add VPS→Supabase dump script"
```

---

### Task B3: Migración de datos

**Files:** ninguno (operación con datos).

- [ ] **Step 1: Aplicar data dump**

```bash
psql "$SUPABASE_DB_URL" -f /tmp/<outdir>/data.sql
```

Expected: completa sin errores. Posibles fallas: violaciones FK por orden de inserts → relanzar tras ajustar orden, o usar `SET session_replication_role = replica;` al inicio del archivo.

- [ ] **Step 2: Verificar paridad de conteos**

Ejecutar en ambas DBs y comparar:

```bash
for t in movimientos medios_pago categorias_maestras servicios_definicion \
         ingresos_definicion presupuestos_definicion movimientos_previstos_mes \
         cuotas_tarjeta prestamos cotizaciones_fx; do
  vps=$(psql "$VPS_PG_URL" -tAc "SELECT count(*) FROM $t")
  sb=$(psql "$SUPABASE_DB_URL" -tAc "SELECT count(*) FROM $t")
  printf "%-30s VPS=%s  SB=%s  %s\n" "$t" "$vps" "$sb" "$([ "$vps" = "$sb" ] && echo OK || echo MISMATCH)"
done
```

Expected: todas las filas marcan `OK`. Si alguna marca `MISMATCH`, investigar y resolver antes de continuar.

- [ ] **Step 3: Resetear sequences**

PostgREST usa sequences para `id`. Tras un import con IDs explícitos, los sequences quedan atrás.

```sql
-- Ejecutar en SQL editor de Supabase
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT sequence_name, table_name, column_name
           FROM information_schema.columns c
           JOIN information_schema.sequences s
             ON s.sequence_name = c.table_name || '_' || c.column_name || '_seq'
           WHERE c.table_schema='public' AND c.column_default LIKE 'nextval%'
  LOOP
    EXECUTE format('SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %I), 1))',
                   r.sequence_name, r.column_name, r.table_name);
  END LOOP;
END$$;
```

Expected: ejecuta sin errores.

---

### Task B4: Aplicar RLS (compartido total)

**Files:**
- Create: `supabase/migrations/003_enable_rls.sql`

- [ ] **Step 1: Crear el SQL de RLS**

```sql
-- supabase/migrations/003_enable_rls.sql
-- Habilita RLS y crea policies "compartido total" para usuarios autenticados.
-- Tablas operativas (bot_sessions, chat_histories) quedan accesibles solo
-- vía service_role (sin policy = denegado a authenticated).

-- ── Tablas operativas (frontend) ───────────────────────────────────────────
DO $$
DECLARE
  t TEXT;
  tables TEXT[] := ARRAY[
    'movimientos',
    'medios_pago',
    'categorias_maestras',
    'servicios_definicion',
    'ingresos_definicion',
    'presupuestos_definicion',
    'movimientos_previstos_mes',
    'cuotas_tarjeta',
    'prestamos',
    'cotizaciones_fx'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'DROP POLICY IF EXISTS auth_all ON public.%I; '
      'CREATE POLICY auth_all ON public.%I '
      'FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t, t
    );
  END LOOP;
END$$;

-- ── Tablas internas (solo service_role, sin policy para authenticated) ─────
ALTER TABLE public.bot_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_histories ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Aplicar en Supabase**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/003_enable_rls.sql
```

Expected: ejecución exitosa.

- [ ] **Step 3: Verificación**

Dashboard → **Authentication → Policies**: cada tabla operativa muestra policy `auth_all` activa.

- [ ] **Step 4: Smoke test con anon (debe fallar)**

```bash
curl -sS "$VITE_SUPABASE_URL/rest/v1/movimientos?select=id&limit=1" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY"
```

Expected: respuesta `[]` o `{ "code":"42501", ... }` (RLS deniega anon). Confirma que la policy filtra correctamente.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/003_enable_rls.sql
git commit -m "feat(db): enable RLS with shared-access policies for authenticated users"
```

---

### Task B5: Smoke test del frontend contra Supabase (rama feature)

**Files:** ninguno (validación local).

- [ ] **Step 1: `.env.local` apuntado a Supabase real**

Verificar:

```bash
VITE_SUPABASE_URL=https://<proyecto-id>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhb...
```

- [ ] **Step 2: Levantar dev server**

```bash
npm run dev
```

- [ ] **Step 3: Login + flujos críticos**

En http://localhost:3000:
1. Login con `mau@<email>`. Verificar que entra al dashboard.
2. **Movimientos:** crear un gasto manual via FAB. Verificar que aparece en el feed y en Supabase Table Editor.
3. **Movimientos:** editar y eliminar. Verificar persistencia.
4. **Cotizaciones:** abrir vista, esperar fetch a CriptoYa, ver que el cache `cotizaciones_fx` recibe filas.
5. **Tarjetas, Servicios, Análisis:** abrir cada vista y confirmar que cargan datos.
6. Cerrar sesión, reabrir, login con `agos@<email>`, repetir step 2.

- [ ] **Step 4: Validar refresh interceptor**

En la consola del browser:

```javascript
// Forzar token expirado
const s = JSON.parse(localStorage.getItem('finanzas-auth'));
s.session.access_token = 'invalid-jwt-to-trigger-401';
localStorage.setItem('finanzas-auth', JSON.stringify(s));
```

Recargar y navegar a Movimientos: el primer fetch debe devolver 401, el store debe refrescar y reintentar — los datos cargan sin pedirte login.

Expected: la lista carga normalmente.

- [ ] **Step 5: Si todo OK, etiquetar el commit como punto de cutover candidato**

```bash
git tag pre-cutover
```

---

## Phase C — Cutover y decommission

### Task C1: Deploy a Firebase y validación en producción

**Files:** ninguno (deploy).

- [ ] **Step 1: Configurar env vars en build de producción**

Si usás Firebase Hosting con build local:

```bash
echo "VITE_SUPABASE_URL=https://<proyecto-id>.supabase.co" > .env.production
echo "VITE_SUPABASE_ANON_KEY=eyJhb..." >> .env.production
```

(`.env.production` debe estar en `.gitignore`.)

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS, dist/ generado.

- [ ] **Step 3: Deploy**

Run: `firebase deploy --only hosting`
Expected: URL de hosting devuelta.

- [ ] **Step 4: Validar en producción**

Repetir Task B5 Step 3 contra la URL de Firebase.

- [ ] **Step 5: Onboarding de Agos**

Compartir URL de la app + credenciales de `agos@<email>`. Confirmar que puede entrar y registrar un movimiento de prueba.

---

### Task C2: Reapuntar n8n y validar bot de Telegram

**Files:** ninguno (config externa).

- [ ] **Step 1: Actualizar credenciales en n8n**

En el panel de n8n del VPS:
- **Credentials → Postgres**: cambiar host a `aws-0-<region>.pooler.supabase.com`, port `5432`, user `postgres.<ref>`, password (la del proyecto), database `postgres`.
- O bien, **Credentials → HTTP Header Auth** para hacer requests a `https://<proyecto>.supabase.co/rest/v1/...` con `apikey` + `Authorization: Bearer <service_role>`.

- [ ] **Step 2: Test runs**

- Disparar un workflow manual: "generar movimientos previstos del mes". Verificar que crea filas en `movimientos_previstos_mes` de Supabase.
- Mandar un mensaje al bot de Telegram: "Cargué un café 1500". Verificar que aparece como `movimiento` en Supabase.

- [ ] **Step 3: Si falla → revertir n8n a VPS Postgres**

Mientras la VPS DB siga corriendo, este rollback es trivial: revertir credenciales en n8n. La rama del frontend se queda en Supabase, pero los workflows automáticos vuelven a la DB vieja temporalmente. Investigar y reintentar.

---

### Task C3: Período de observación (7 días)

**Files:** ninguno.

- [ ] **Step 1: Monitorear durante 7 días**

Daily check:
- Supabase dashboard → **Database → Logs**: sin errores recurrentes.
- Verificar conteos de filas crecen consistentemente (movimientos, etc.).
- Disponibilidad de Supabase (es free tier — pausa proyectos inactivos tras 7 días sin uso, pero con uso diario eso no aplica).
- Bandwidth: dashboard → **Reports**, debe estar muy lejos del cap.

- [ ] **Step 2: Si pasan 7 días sin incidentes, proceder a Task C4. Si hubo incidente y se resolvió, reiniciar el contador.**

---

### Task C4: Decommission VPS PostgREST y Tailscale

**Files:**
- Modify: `docs/PROJECT_TRACKING.md`

- [ ] **Step 1: Backup final del VPS Postgres**

```bash
pg_dump "$VPS_PG_URL" -Fc -f /backups/finanzas-pre-decommission-$(date +%Y%m%d).dump
```

Guardar en almacenamiento seguro (offline o cloud).

- [ ] **Step 2: Apagar PostgREST en Coolify**

En el panel de Coolify, detener (no eliminar) el servicio `postgrest`. Mantener detenido por 2 semanas más antes de eliminar.

- [ ] **Step 3: Apagar Tailscale en VPS**

```bash
sudo systemctl stop tailscaled
sudo systemctl disable tailscaled
```

(Mantener `n8n` corriendo, ahora apunta a Supabase y no requiere Tailscale.)

- [ ] **Step 4: Limpiar `VITE_API_URL` del frontend**

Buscar y eliminar referencias muertas:

Run: `grep -rn "VITE_API_URL" src/ docs/`
Expected: solo referencias en docs históricos. Si aparece en código vivo, remover.

Eliminar la línea de `.env.local` y `.env.production`.

- [ ] **Step 5: Cerrar D1 en `PROJECT_TRACKING.md`**

Localizar el bloque de hallazgo D1 y agregar:

```markdown
| D1 | Certificado self-signed en PostgREST | 🔴 Alta | ✅ Resuelto 2026-MM-DD | Migrado a Supabase free tier (TLS válido nativo). PostgREST en VPS detenido. Ver `docs/spec/2026-04-27-supabase-migration-design.md`. |
```

Y en la sección de fases:

```markdown
| Phase 4: Cert TLS | 2026-MM-DD | ✅ | Resuelto vía migración a Supabase |
```

- [ ] **Step 6: Commit final**

```bash
git add docs/PROJECT_TRACKING.md .env.local .env.production
git commit -m "chore(infra): decommission VPS PostgREST and Tailscale; close D1"
```

- [ ] **Step 7: Merge la rama feature a main**

```bash
git checkout main
git merge --no-ff feat/supabase-migration
git push
```

---

## Rollback Plan (cualquier punto antes de Task C4)

**Si algo falla durante Phase C antes de detener PostgREST:**

- [ ] **Step 1: Revertir env vars de producción**

En `.env.production` restaurar:
```bash
VITE_API_URL=https://n8n.tail089052.ts.net
```
y eliminar las dos vars de Supabase.

- [ ] **Step 2: Checkout del commit pre-migración**

```bash
git checkout pre-cutover^   # commit anterior al primero de la rama
npm run build && firebase deploy --only hosting
```

- [ ] **Step 3: Revertir n8n credentials a Postgres VPS local**

RTO esperado: < 5 minutos. Datos del VPS no fueron tocados durante toda la migración.

---

## Notes for the implementer

- **Trabajar en una rama dedicada:** `git checkout -b feat/supabase-migration`. No mezclar con otras features.
- **No hacer push a main** hasta completar Task C4.
- **No ejecutar Task B (operaciones de DB) hasta tener Phase A merged localmente y la suite de tests verde.**
- **Variables sensibles** (`SUPABASE_DB_URL`, `service_role key`) nunca van al repo. Solo a `.env.local` (ignorado) o variables de entorno de tu shell.
- Si se encuentra un schema en `001_finanzas_rearchitecture.sql` o `002_spec_v1_migration.sql` que no se haya aplicado nunca al VPS, considerar aplicarlo directamente en Supabase tras Task B2 Step 4 — Supabase es buen lugar para empezar limpio.
