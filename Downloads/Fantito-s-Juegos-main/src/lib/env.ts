/**
 * env.ts
 * ------
 * Single source of truth for all environment variables.
 * Validates at startup — the app will throw immediately if a required
 * variable is missing, rather than failing silently at runtime.
 *
 * Usage:
 *   import { env } from '@/lib/env';
 *   const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
 */

function requireEnv(key: string): string {
    const value = import.meta.env[key];
    if (!value || value.trim() === '') {
      throw new Error(
        `[env] Missing required environment variable: "${key}"\n` +
        `Copy .env.example to .env and fill in your Supabase credentials.`
      );
    }
    return value.trim();
  }
  
  export const env = {
    SUPABASE_URL:      requireEnv('VITE_SUPABASE_URL'),
    SUPABASE_ANON_KEY: requireEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
    SUPABASE_PROJECT_ID: requireEnv('VITE_SUPABASE_PROJECT_ID'),
  } as const;