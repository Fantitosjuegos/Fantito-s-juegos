/**
 * supabase/client.ts
 * ------------------
 * Initialises the Supabase client.
 * NOTE: localStorage is used here for web. In Phase 4 (Capacitor),
 * replace `storage: localStorage` with the Capacitor Preferences adapter.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { env } from '@/lib/env';

export const supabase = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      storage: localStorage,    // TODO (Phase 4): replace with Capacitor adapter
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);