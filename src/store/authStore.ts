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
  refresh: (refreshToken?: string) => Promise<SupabaseSession | null>;
  hydrate: () => void;
}

function isValidSession(obj: unknown): obj is { session: SupabaseSession } {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  if (!o.session || typeof o.session !== 'object') return false;
  const s = o.session as Record<string, unknown>;
  return (
    typeof s.access_token === 'string' &&
    typeof s.refresh_token === 'string' &&
    typeof s.expires_at === 'number' &&
    typeof s.token_type === 'string'
  );
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

  refresh: async (refreshToken?: string) => {
    const token = refreshToken || get().session?.refresh_token;
    if (!token) return null;
    try {
      const fresh = await auth.refreshSession(token);
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
      const parsed = JSON.parse(raw);
      if (!isValidSession(parsed)) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      const now = Math.floor(Date.now() / 1000);
      if (parsed.session.expires_at > now) {
        set({ session: parsed.session, status: 'authenticated' });
      } else {
        // P1-SCH-8: Attempt silent refresh using the persisted refresh_token
        get().refresh(parsed.session.refresh_token).then(fresh => {
          if (!fresh) localStorage.removeItem(STORAGE_KEY);
        });
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  },
}));
