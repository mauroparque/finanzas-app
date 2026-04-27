import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../config/supabase', () => ({
  AUTH_BASE: 'https://test.supabase.co/auth/v1',
  SUPABASE_ANON_KEY: 'anon-key',
}));

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
});
