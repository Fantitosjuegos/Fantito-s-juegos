import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { storage } from '@/lib/storage';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Loader2, Mail, ArrowLeft, Sparkles, Flame, Eye, Skull, Heart } from 'lucide-react';
import PrivacyModal from '../components/PrivacyModal';

const emailSchema    = z.string().trim().email({ message: 'Invalid email' }).max(255);
const passwordSchema = z.string().min(6, { message: 'Password must be at least 6 characters' }).max(72);

const FANTITO_LINES = [
  '🤠 I can remember your chaos for next time.',
  '👀 Your crew history deserves to be saved.',
  '🔥 Sign in to unlock the dangerous stuff.',
  '💀 I already know this group is coming back.',
];

const PERKS = [
  { icon: Flame,    label: 'Unlock deeper chaos modes' },
  { icon: Eye,      label: 'AI remembers your crew' },
  { icon: Heart,    label: 'Save favorite cards & inside jokes' },
  { icon: Skull,    label: 'Track betrayals across sessions' },
  { icon: Sparkles, label: 'The AI evolves with your group' },
];

const Auth = () => {
  const navigate   = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [params]   = useSearchParams();
  const redirect   = params.get('redirect') ?? '/';
  const [mode, setMode]             = useState<'signin' | 'signup'>('signin');
  const [showEmail, setShowEmail]   = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [oauthBusy, setOauthBusy]   = useState<null | 'google' | 'apple'>(null);
  const [lineIdx, setLineIdx]       = useState(0);

  useEffect(() => {
    if (!authLoading && user) navigate(redirect, { replace: true });
  }, [user, authLoading, navigate, redirect]);

  useEffect(() => {
    const id = setInterval(() => setLineIdx(i => (i + 1) % FANTITO_LINES.length), 3500);
    return () => clearInterval(id);
  }, []);

  const isSignup = mode === 'signup';

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthBusy(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: (window.location.origin.startsWith('capacitor') ? 'app.fantitosjuegos.fun://auth/callback' : window.location.origin) + redirect,
        },
      });

      if (error) {
        toast({ title: 'Sign in failed', description: error.message ?? 'Try again', variant: 'destructive' });
        setOauthBusy(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      toast({ title: 'Sign in failed', description: msg, variant: 'destructive' });
      setOauthBusy(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRes = emailSchema.safeParse(email);
    const passRes  = passwordSchema.safeParse(password);

    if (!emailRes.success || !passRes.success) {
      toast({ title: 'Invalid input', description: 'Please check your email and password.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email: emailRes.data,
          password: passRes.data,
          options: { emailRedirectTo: `${window.location.origin.startsWith('capacitor') ? 'app.fantitosjuegos.fun://auth/callback' : window.location.origin}${redirect}` },
        });
        if (error) throw error;
        toast({ title: '🔥 Chaos profile created', description: 'Check your email to verify.' });
        setMode('signin');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: emailRes.data, password: passRes.data });
        if (error) throw error;
        if (staySignedIn) await storage.remove('fantito_ephemeral_session');
        else              await storage.set('fantito_ephemeral_session', '1');
        navigate(redirect, { replace: true });
      }
    } catch (err) {
      toast({ title: 'Authentication error', description: err instanceof Error ? err.message : 'Something went wrong', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const dots = useMemo(() => Array.from({ length: 16 }).map((_, i) => ({ id: i, left: (i * 53) % 100, top: (i * 37) % 100, delay: ((i % 7) * 0.4).toFixed(2), size: 2 + (i % 3) })), []);

  return (
    <main className="relative min-h-[100dvh] max-w-[430px] mx-auto bg-background overflow-hidden flex flex-col">
      <Helmet>
        <title>Sign in — Fantito's Juegos</title>
      </Helmet>

      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {/* Background implementation same as before... */}
      </div>

      <button onClick={() => navigate('/')} className="relative z-10 flex items-center gap-1.5 text-xs font-display font-semibold text-muted-foreground hover:text-foreground transition-colors px-4 pt-4 self-start">
        <ArrowLeft className="w-3.5 h-3.5" /> Continue as guest
      </button>

      <div className="relative z-10 flex-1 flex flex-col px-5 pt-2 pb-6">
        <div className="flex flex-col items-center text-center pt-2 pb-5">
           <img src="/fantito-loader.svg" alt="Fantito" className="w-24 h-24 rounded-3xl object-cover border border-white/20" />
           <h1 className="mt-4 font-display text-3xl font-black text-foreground leading-tight">
             {isSignup ? 'Unlock your chaos universe' : 'Continue the chaos'}
           </h1>
        </div>

        <div className="space-y-2.5">
          <button onClick={() => handleOAuth('google')} disabled={!!oauthBusy} className="w-full flex items-center justify-center gap-2.5 bg-foreground text-background font-display font-bold text-base py-3.5 rounded-2xl transition-all disabled:opacity-60">
            {oauthBusy === 'google' ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleGlyph />}
            <span>{isSignup ? 'Sign up with Google' : 'Continue with Google'}</span>
          </button>

          {/* Privacy Link triggered here */}
          <p className="text-center text-[10px] text-muted-foreground px-4">
            By signing in, you agree to our <button onClick={() => setShowPrivacy(true)} className="underline hover:text-primary">Privacy Policy</button>.
          </p>
        </div>

        {/* ... rest of your form logic ... */}
      </div>
      
      <PrivacyModal open={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </main>
  );
};

/* SVG Glyphs and other code remain the same */
export default Auth;