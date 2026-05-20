/**
 * storage.ts
 * ----------
 * Platform-aware key-value storage abstraction.
 *
 * - On native (iOS / Android via Capacitor) → uses @capacitor/preferences
 *   which writes to NSUserDefaults (iOS) or SharedPreferences (Android).
 *   These persist across app restarts and are never cleared by the OS.
 *
 * - On web (browser / local dev) → falls back to localStorage, which is
 *   what the app used before. Zero behaviour change in the browser.
 *
 * ALL storage calls in the app go through this module.
 * When you add a new Capacitor plugin or switch platform, you change
 * this file — nothing else.
 *
 * Usage:
 *   import { storage } from '@/lib/storage';
 *   await storage.set('my-key', 'my-value');
 *   const val = await storage.get('my-key');   // string | null
 *   await storage.remove('my-key');
 */

/** Detects whether we are running inside a Capacitor native runtime. */
function isNative(): boolean {
    return (
      typeof window !== 'undefined' &&
      !!(window as typeof window & { Capacitor?: { isNativePlatform?: () => boolean } })
        .Capacitor?.isNativePlatform?.()
    );
  }
  
  interface StorageAdapter {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
  }
  
  // ── Native adapter (Capacitor Preferences) ──────────────────────────────────
  // Loaded lazily so that importing this module in a browser never triggers
  // a Capacitor import error.
  async function getNativeAdapter(): Promise<StorageAdapter> {
    const { Preferences } = await import('@capacitor/preferences');
    return {
      async get(key) {
        const { value } = await Preferences.get({ key });
        return value;
      },
      async set(key, value) {
        await Preferences.set({ key, value });
      },
      async remove(key) {
        await Preferences.remove({ key });
      },
    };
  }
  
  // ── Web adapter (localStorage) ───────────────────────────────────────────────
  const webAdapter: StorageAdapter = {
    async get(key) {
      try { return localStorage.getItem(key); }
      catch { return null; }
    },
    async set(key, value) {
      try { localStorage.setItem(key, value); }
      catch { /* quota exceeded — silently ignore */ }
    },
    async remove(key) {
      try { localStorage.removeItem(key); }
      catch { /* ignore */ }
    },
  };
  
  // ── Cached adapter instance ──────────────────────────────────────────────────
  let _adapter: StorageAdapter | null = null;
  
  async function getAdapter(): Promise<StorageAdapter> {
    if (_adapter) return _adapter;
    if (isNative()) {
      _adapter = await getNativeAdapter();
    } else {
      _adapter = webAdapter;
    }
    return _adapter;
  }
  
  // ── Public API ───────────────────────────────────────────────────────────────
  export const storage = {
    async get(key: string): Promise<string | null> {
      return (await getAdapter()).get(key);
    },
  
    async set(key: string, value: string): Promise<void> {
      return (await getAdapter()).set(key, value);
    },
  
    async remove(key: string): Promise<void> {
      return (await getAdapter()).remove(key);
    },
  
    /** Convenience: get a JSON value, returns null on parse error. */
    async getJSON<T>(key: string): Promise<T | null> {
      const raw = await storage.get(key);
      if (!raw) return null;
      try { return JSON.parse(raw) as T; }
      catch { return null; }
    },
  
    /** Convenience: set a JSON-serialisable value. */
    async setJSON<T>(key: string, value: T): Promise<void> {
      await storage.set(key, JSON.stringify(value));
    },
  };
  
  // ── Supabase auth storage adapter ───────────────────────────────────────────
  // Supabase's createClient accepts a `storage` option that must satisfy
  // the StorageAdapter interface below. This wires our abstraction in.
  export const supabaseStorageAdapter = {
    getItem: async (key: string): Promise<string | null> => storage.get(key),
    setItem: async (key: string, value: string): Promise<void> => storage.set(key, value),
    removeItem: async (key: string): Promise<void> => storage.remove(key),
  };