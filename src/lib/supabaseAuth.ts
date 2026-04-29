import { AUTH_BASE, SUPABASE_PUBLISHABLE_KEY } from '../config/supabase';

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

function validateAuthResponse(json: unknown): SupabaseSession {
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid auth response: not an object');
  }
  const o = json as Record<string, unknown>;
  if (
    typeof o.access_token !== 'string' ||
    typeof o.refresh_token !== 'string' ||
    typeof o.expires_in !== 'number' ||
    typeof o.token_type !== 'string' ||
    !o.user || typeof o.user !== 'object'
  ) {
    throw new Error('Invalid auth response: missing required fields');
  }
  return {
    access_token: o.access_token,
    refresh_token: o.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + o.expires_in,
    token_type: o.token_type as 'bearer',
    user: o.user as { id: string; email: string },
  };
}

async function authRequest(path: string, body: unknown, token?: string): Promise<unknown> {
  const res = await fetch(`${AUTH_BASE}${path}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
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
  return json;
}

export async function signIn(email: string, password: string): Promise<SupabaseSession> {
  const raw = await authRequest('/token?grant_type=password', { email, password });
  return validateAuthResponse(raw);
}

export async function refreshSession(refreshToken: string): Promise<SupabaseSession> {
  const raw = await authRequest('/token?grant_type=refresh_token', { refresh_token: refreshToken });
  return validateAuthResponse(raw);
}

export async function signOut(accessToken: string): Promise<void> {
  try {
    await fetch(`${AUTH_BASE}/logout`, {
      method: 'POST',
      headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    });
  } catch {
    // logout is best-effort; the local session is wiped regardless
  }
}
