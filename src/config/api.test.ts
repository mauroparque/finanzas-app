import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../config/supabase', () => ({
  REST_BASE: 'https://api.test.com/rest/v1',
  AUTH_BASE: 'https://api.test.com/auth/v1',
  SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
}));

import {
  apiGet,
  apiGetOne,
  apiPost,
  apiPatch,
  apiDelete,
} from './api';
import { mockFetch, mockFetch204 } from '../test/helpers';
import { useAuthStore } from '../store/authStore';

describe('PostgREST API CRUD helpers', () => {
  beforeEach(() => {
    import.meta.env.VITE_SUPABASE_URL = 'https://api.test.com';
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'publishable-key';
    import.meta.env.DEV = true;
    useAuthStore.setState({ session: null, status: 'idle', error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ session: null, status: 'idle', error: null });
  });

  describe('apiGet', () => {
    it('returns typed array from GET request', async () => {
      const data = [{ id: 1, nombre: 'Test' }];
      mockFetch(data);
      const result = await apiGet<{ id: number; nombre: string }>('/test');
      expect(result).toEqual(data);
    });

    it('passes query params to URL', async () => {
      mockFetch([]);
      await apiGet('/test', { activo: 'eq.true' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('activo=eq.true'),
        expect.any(Object)
      );
    });

    it('throws on non-ok response', async () => {
      mockFetch(null, false);
      await expect(apiGet('/test')).rejects.toThrow('[api] GET');
    });
  });

  describe('apiGetOne', () => {
    it('returns single record when found', async () => {
      const data = { id: 1, nombre: 'Test' };
      mockFetch([data]);
      const result = await apiGetOne<{ id: number; nombre: string }>('/test', { id: 'eq.1' });
      expect(result).toEqual(data);
    });

    it('returns null when no record found', async () => {
      mockFetch([]);
      const result = await apiGetOne<{ id: number }>('/test', { id: 'eq.999' });
      expect(result).toBeNull();
    });

    it('returns null on 404', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false, status: 404,
        text: () => Promise.resolve('Not found'),
        json: () => Promise.resolve({}),
      }) as never;
      const result = await apiGetOne<{ id: number }>('/test');
      expect(result).toBeNull();
    });

    it('throws on 5xx', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false, status: 500,
        text: () => Promise.resolve('Server error'),
        json: () => Promise.resolve({}),
      }) as never;
      await expect(apiGetOne<{ id: number }>('/test')).rejects.toThrow('[api] GET');
    });

    it('uses pgrst.object+json accept header', async () => {
      mockFetch([]);
      await apiGetOne('/test', { id: 'eq.1' });
      const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[1].headers).toMatchObject({
        Accept: 'application/vnd.pgrst.object+json',
      });
    });
  });

  describe('apiPost', () => {
    it('sends body as JSON and returns created record', async () => {
      const created = { id: 1, nombre: 'Created' };
      mockFetch([created]);
      const result = await apiPost('/test', { nombre: 'Created' });
      expect(result).toEqual(created);
    });

    it('handles PostgREST Prefer: return=representation array response', async () => {
      const record = { id: 42, monto: 100 };
      mockFetch([record]);
      const result = await apiPost<{ monto: number }, { id: number; monto: number }>('/test', { monto: 100 });
      expect(result).toEqual(record);
    });
  });

  describe('apiPatch', () => {
    it('sends filter params and partial body', async () => {
      const updated = [{ id: 1, nombre: 'Updated' }];
      mockFetch(updated);
      const result = await apiPatch('/test', { id: 'eq.1' }, { nombre: 'Updated' });
      expect(result).toEqual(updated);
      const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const [, opts] = call;
      const body = JSON.parse(opts.body as string);
      expect(body).toEqual({ nombre: 'Updated' });
    });
  });

  describe('apiDelete', () => {
    it('sends DELETE with filter params', async () => {
      mockFetch(null);
      await apiDelete('/test', { id: 'eq.1' });
      const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(call[0]).toContain('id=eq.1');
      expect(call[1].method).toBe('DELETE');
    });

    it('handles 204 No Content', async () => {
      mockFetch204();
      await expect(apiDelete('/test', { id: 'eq.1' })).resolves.toBeUndefined();
    });
  });
});

describe('auth headers', () => {
  beforeEach(() => {
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
      apikey: 'publishable-key',
      Authorization: 'Bearer jwt-1',
    });
  });

  it('omits Authorization when no session (anon access still gets apikey)', async () => {
    useAuthStore.setState({ session: null, status: 'idle', error: null });
    mockFetch([{ id: 1 }]);
    await apiGet('/movimientos');
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[1].headers).toMatchObject({ apikey: 'publishable-key' });
    expect(call[1].headers).not.toHaveProperty('Authorization');
  });

  it('builds URL against /rest/v1 base', async () => {
    mockFetch([]);
    await apiGet('/movimientos');
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toContain('https://api.test.com/rest/v1/movimientos');
  });
});

describe('401 refresh interceptor', () => {
  beforeEach(() => {
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
