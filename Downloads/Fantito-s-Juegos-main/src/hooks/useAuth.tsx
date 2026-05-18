import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      setLoading(false);
    });

    // If the user opted out of "stay signed in", sign them out when the tab
    // closes. The flag is set by the Auth page on sign-in.
    const handleUnload = () => {
      if (localStorage.getItem('fantito_ephemeral_session') === '1') {
        // Best-effort synchronous-ish cleanup of the persisted session.
        supabase.auth.signOut();
        localStorage.removeItem('fantito_ephemeral_session');
      }
    };
    window.addEventListener('pagehide', handleUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('pagehide', handleUnload);
    };
  }, []);

  const signOut = async () => {
    localStorage.removeItem('fantito_ephemeral_session');
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
