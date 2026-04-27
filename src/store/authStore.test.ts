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
