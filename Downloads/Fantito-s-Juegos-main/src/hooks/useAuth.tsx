/**
 * useAuth.tsx
 * -----------
 * Auth context provider. Manages the Supabase session lifecycle.
 *
 * Changes from previous version:
 *  - All localStorage calls replaced with the platform-aware `storage` module.
 *  - `window.addEventListener('pagehide', ...)` replaced with a dual listener:
 *      • web: 'pagehide' (browser)
 *      • native: Capacitor App 'appStateChange' event
 *    This ensures the ephemeral session is cleaned up on both platforms.
 */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { storage } from '@/lib/storage';

const EPHEMERAL_KEY = 'fantito_ephemeral_session';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Subscribe to auth changes first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    // 2. Hydrate from persisted session
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      setLoading(false);
    });

    // 3. Ephemeral session cleanup
    //    Web: pagehide fires when the tab/window is being unloaded
    //    Native: appStateChange fires when the app moves to background (close equivalent)
    const cleanup = async () => {
      const flag = await storage.get(EPHEMERAL_KEY);
      if (flag === '1') {
        supabase.auth.signOut();
        await storage.remove(EPHEMERAL_KEY);
      }
    };

    // Web listener
    window.addEventListener('pagehide', cleanup);

    // Native listener — loaded lazily so it doesn't break the web bundle
    let removeCapacitorListener: (() => void) | null = null;
    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const handle = await App.addListener('appStateChange', async ({ isActive }) => {
          if (!isActive) await cleanup();
        });
        removeCapacitorListener = () => handle.remove();
      } catch {
        // Not in a Capacitor environment — no-op
      }
    })();

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('pagehide', cleanup);
      removeCapacitorListener?.();
    };
  }, []);

  const signOut = async () => {
    await storage.remove(EPHEMERAL_KEY);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};