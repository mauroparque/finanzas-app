/**
 * Supabase configuration
 * Single source of truth for the project URL and anon key.
 */

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

if (!SUPABASE_URL) {
  console.warn('[supabase] VITE_SUPABASE_URL is not set');
}
if (!SUPABASE_PUBLISHABLE_KEY) {
  console.warn('[supabase] VITE_SUPABASE_PUBLISHABLE_KEY is not set');
}

export const REST_BASE = `${SUPABASE_URL}/rest/v1`;
export const AUTH_BASE = `${SUPABASE_URL}/auth/v1`;
