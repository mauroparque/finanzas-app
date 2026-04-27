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
