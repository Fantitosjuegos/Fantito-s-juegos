import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Loader2, Mail, ArrowLeft, Sparkles, Flame, Eye, Skull, Heart } from 'lucide-react';
import mascot from '@/assets/mascot.png';

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

  // ── OAuth (Google / Apple) ─────────────────────────────────────────────────
  // Uses Supabase directly — no Lovable dependency.
  // Make sure both providers are enabled in:
  //   Supabase Dashboard → Authentication → Providers
  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthBusy(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // After OAuth the user lands back on the app at this URL.
          // In Phase 4 (Capacitor) this must be changed to a deep-link URI,
          // e.g. "fantitosjuegos://auth/callback"
          redirectTo: window.location.origin + redirect,
        },
      });

      if (error) {
        toast({
          title: 'Sign in failed',
          description: error.message ?? 'Try again',
          variant: 'destructive',
        });
        setOauthBusy(null);
      }
      // On success Supabase redirects the browser — no need to navigate()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      toast({ title: 'Sign in failed', description: msg, variant: 'destructive' });
      setOauthBusy(null);
    }
  };

  // ── Email / password ───────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRes = emailSchema.safeParse(email);
    const passRes  = passwordSchema.safeParse(password);

    if (!emailRes.success) {
      toast({ title: 'Invalid email', description: emailRes.error.issues[0].message, variant: 'destructive' });
      return;
    }
    if (!passRes.success) {
      toast({ title: 'Invalid password', description: passRes.error.issues[0].message, variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email: emailRes.data,
          password: passRes.data,
          options: { emailRedirectTo: `${window.location.origin}${redirect}` },
        });
        if (error) throw error;
        toast({ title: '🔥 Chaos profile created', description: 'Check your email to verify, then jump back in.' });
        setMode('signin');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailRes.data,
          password: passRes.data,
        });
        if (error) throw error;

        // Ephemeral session flag — kept for now; will be replaced in Phase 4
        if (staySignedIn) localStorage.removeItem('fantito_ephemeral_session');
        else              localStorage.setItem('fantito_ephemeral_session', '1');

        navigate(redirect, { replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      toast({ title: 'Authentication error', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // Stable decorative particles
  const dots = useMemo(
    () => Array.from({ length: 16 }).map((_, i) => ({
      id:    i,
      left:  (i * 53) % 100,
      top:   (i * 37) % 100,
      delay: ((i % 7) * 0.4).toFixed(2),
      size:  2 + (i % 3),
    })),
    [],
  );

  return (
    <main className="relative min-h-[100dvh] max-w-[430px] mx-auto bg-background overflow-hidden flex flex-col">
      <Helmet>
        <title>Sign in — Fantito's Juegos</title>
        <meta name="description" content="Sign in to Fantito's Juegos to unlock deeper chaos modes, save crew history, and let the AI evolve with your group." />
        <link rel="canonical" href="https://fantitosjuegos.fun/auth" />
        <meta property="og:title" content="Sign in — Fantito's Juegos" />
        <meta property="og:description" content="Unlock deeper chaos modes and let Fantito remember your crew." />
        <meta property="og:url" content="https://fantitosjuegos.fun/auth" />
      </Helmet>

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(60% 40% at 50% 0%, hsl(var(--primary) / 0.28), transparent 70%),
              radial-gradient(50% 35% at 12% 80%, hsl(var(--accent) / 0.22), transparent 70%),
              radial-gradient(45% 30% at 88% 70%, hsl(var(--primary) / 0.18), transparent 70%)
            `,
            filter: 'blur(2px)',
          }}
        />
        {dots.map(d => (
          <span
            key={d.id}
            className="absolute rounded-full vs-float"
            style={{
              left:             `${d.left}%`,
              top:              `${d.top}%`,
              width:            d.size,
              height:           d.size,
              background:       'hsl(var(--primary) / 0.55)',
              boxShadow:        '0 0 8px hsl(var(--primary) / 0.7)',
              animationDelay:   `${d.delay}s`,
              animationDuration:`${4 + (d.id % 4)}s`,
            }}
          />
        ))}
      </div>

      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="relative z-10 flex items-center gap-1.5 text-xs font-display font-semibold text-muted-foreground hover:text-foreground transition-colors px-4 pt-4 self-start"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Continue as guest
      </button>

      <div className="relative z-10 flex-1 flex flex-col px-5 pt-2 pb-6">
        {/* Mascot + tagline */}
        <div className="flex flex-col items-center text-center pt-2 pb-5">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-3xl blur-2xl vs-pulse-glow"
              style={{ background: 'hsl(var(--primary) / 0.6)' }}
            />
            <img
              src={mascot}
              alt="Fantito"
              className="relative w-24 h-24 rounded-3xl object-cover border border-white/20 vs-float"
              loading="eager"
            />
          </div>
          <p className="mt-4 text-[10px] font-display font-bold tracking-[0.2em] uppercase text-muted-foreground">
            {isSignup ? 'Build your chaos profile' : 'Welcome back to the chaos'}
          </p>
          <h1 className="mt-1 font-display text-3xl font-black text-foreground leading-tight">
            {isSignup ? (
              <>Unlock your <span style={{ color: 'hsl(var(--primary))' }}>chaos universe</span></>
            ) : (
              <>Continue the <span style={{ color: 'hsl(var(--primary))' }}>chaos</span></>
            )}
          </h1>
          <div className="mt-3 h-5 relative w-full max-w-[300px] overflow-hidden">
            {FANTITO_LINES.map((line, i) => (
              <p
                key={i}
                className="absolute inset-x-0 text-sm text-foreground/80 font-display transition-all duration-500"
                style={{
                  opacity:   i === lineIdx ? 1 : 0,
                  transform: `translateY(${i === lineIdx ? 0 : 6}px)`,
                }}
              >
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Perks grid */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {PERKS.slice(0, 4).map(({ icon: Icon, label }, i) => (
            <div
              key={label}
              className="vs-rise rounded-xl border border-white/10 bg-card/50 backdrop-blur-sm px-3 py-2.5 flex items-center gap-2"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
              <span className="text-[11px] font-display font-semibold text-foreground leading-tight">{label}</span>
            </div>
          ))}
        </div>

        {/* OAuth buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={!!oauthBusy}
            className="relative w-full flex items-center justify-center gap-2.5 bg-foreground text-background font-display font-bold text-base py-3.5 rounded-2xl active:scale-[0.98] transition-all disabled:opacity-60 vs-pulse-glow overflow-hidden"
            style={{ boxShadow: '0 0 24px -6px hsl(var(--primary) / 0.7)' }}
          >
            {oauthBusy === 'google' ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleGlyph />}
            <span>{isSignup ? 'Sign up with Google' : 'Continue with Google'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleOAuth('apple')}
            disabled={!!oauthBusy}
            className="w-full flex items-center justify-center gap-2.5 bg-card border border-white/15 text-foreground font-display font-bold text-base py-3.5 rounded-2xl active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {oauthBusy === 'apple' ? <Loader2 className="w-5 h-5 animate-spin" /> : <AppleGlyph />}
            <span>{isSignup ? 'Sign up with Apple' : 'Continue with Apple'}</span>
          </button>

          <p className="text-center text-[11px] text-muted-foreground pt-1">
            Takes ~3 seconds · No setup
          </p>
        </div>

        {/* Email fallback */}
        {!showEmail ? (
          <button
            type="button"
            onClick={() => setShowEmail(true)}
            className="mt-5 mx-auto flex items-center gap-1.5 text-xs font-display font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            Use email instead
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2.5 mt-5 vs-rise">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Where should Fantito send the chaos?"
              autoComplete="email"
              required
              className="w-full bg-card/60 backdrop-blur-sm border border-white/10 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 rounded-xl transition-all"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Your secret chaos access 👀"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
              className="w-full bg-card/60 backdrop-blur-sm border border-white/10 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 rounded-xl transition-all"
            />
            {!isSignup && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none px-1">
                <input
                  type="checkbox"
                  checked={staySignedIn}
                  onChange={e => setStaySignedIn(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-background accent-primary cursor-pointer"
                />
                Remember me on this device
              </label>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full text-primary-foreground font-display font-black text-base py-3.5 rounded-2xl disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              style={{
                background:  'linear-gradient(120deg, hsl(var(--primary)), hsl(var(--accent)))',
                boxShadow:   '0 0 22px -6px hsl(var(--primary) / 0.65)',
              }}
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSignup ? '🔥 Unlock my chaos profile' : '🔥 Continue the chaos'}
            </button>
            {isSignup && (
              <p className="text-[11px] text-center text-accent font-display font-semibold pt-0.5">
                🎁 +250 chaos cards on signup · unlock dangerous game modes
              </p>
            )}
          </form>
        )}

        {/* Mode toggle */}
        <div className="mt-auto pt-6 text-center">
          <button
            type="button"
            onClick={() => { setMode(isSignup ? 'signin' : 'signup'); setShowEmail(false); }}
            className="text-sm font-display text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignup ? (
              <>Already in the chaos? <span className="text-primary font-semibold">Sign in</span></>
            ) : (
              <>New here? <span className="text-primary font-semibold">Build your profile</span></>
            )}
          </button>
        </div>
      </div>
    </main>
  );
};

// ── Inline SVG glyphs ──────────────────────────────────────────────────────────
const GoogleGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20.5H24v8h11.3c-1.6 4.6-6 7.9-11.3 7.9-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 8 3l5.7-5.7C33.6 6.5 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.7 0 19.5-8.7 19.5-19.5 0-1.2-.1-2.3-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.1 18.9 13.5 24 13.5c3 0 5.8 1.1 8 3l5.7-5.7C33.6 6.5 29 4.5 24 4.5 16.6 4.5 10.2 8.6 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.9 12.9-5l-6-5.1c-2 1.4-4.5 2.3-6.9 2.3-5.3 0-9.7-3.3-11.3-7.9l-6.6 5.1C9.9 39 16.4 43.5 24 43.5z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20.5H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6 5.1c-.4.4 6.6-4.8 6.6-15 0-1.2-.1-2.3-.3-3.5z"/>
  </svg>
);

const AppleGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.05 20.28c-.98.95-2.05.86-3.08.43-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.43C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

export default Auth;