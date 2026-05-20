/**
 * supabase/client.ts
 * ------------------
 * Initialises the Supabase client with the platform-aware storage adapter.
 * On native (Capacitor) this writes to NSUserDefaults / SharedPreferences.
 * On web it falls back to localStorage — identical behaviour to before.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { env } from '@/lib/env';
import { supabaseStorageAdapter } from '@/lib/storage';

export const supabase = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  {
    auth: {
      storage:          supabaseStorageAdapter,
      persistSession:   true,
      autoRefreshToken: true,
    },
  }
);