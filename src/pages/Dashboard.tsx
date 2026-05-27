/**
 * pages/Dashboard.tsx
 * --------------------
 * Admin-only analytics dashboard.
 * Protected: redirects to / if the user is not an admin.
 *
 * Data sources (all from Supabase — no external analytics service needed):
 *  - profiles      → user count, premium breakdown, cards remaining
 *  - skipped_cards → swipe actions, card type performance, language split
 *  - rate_limits   → API call volume
 *  - promo_codes   → promo usage
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// ─── types ────────────────────────────────────────────────────────────────────
interface Stats {
  // Users
  totalUsers: number;
  freeUsers: number;
  creditUsers: number;
  subscribedUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  // Cards / swipes
  totalSwipes: number;
  swipesToday: number;
  skipRate: number;
  starRate: number;
  topCardTypes: { type: string; count: number; skip_rate: number; star_rate: number }[];
  languageSplit: { language: string; count: number }[];
  vibesSplit: { vibe: string; count: number }[];
  // Credits
  avgCardsRemaining: number;
  totalCardsInSystem: number;
  // Promo
  promoCodes: { code: string; current_uses: number; max_uses: number; cards_granted: number; is_active: boolean }[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────
const pct = (n: number, total: number) => total === 0 ? '0%' : `${Math.round((n / total) * 100)}%`;
const num = (n: number) => n?.toLocaleString() ?? '—';

const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="bg-card border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-1">
    <p className="text-[11px] text-muted-foreground font-display font-semibold uppercase tracking-wider">{label}</p>
    <p className="text-2xl font-display font-black text-foreground">{typeof value === 'number' ? num(value) : value}</p>
    {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
  </div>
);

const Bar = ({ label, value, max, color = 'hsl(var(--primary))' }: { label: string; value: number; max: number; color?: string }) => (
  <div className="flex items-center gap-3">
    <span className="text-[11px] text-muted-foreground w-20 shrink-0 truncate">{label}</span>
    <div className="flex-1 bg-white/[0.06] rounded-full h-2 overflow-hidden">
      <div className="h-2 rounded-full transition-all" style={{ width: `${max === 0 ? 0 : Math.round((value / max) * 100)}%`, background: color }} />
    </div>
    <span className="text-[11px] text-foreground/70 w-8 text-right shrink-0">{value}</span>
  </div>
);

// ─── main ─────────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'overview' | 'cards' | 'users' | 'promos'>('overview');

  // ── auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth?redirect=/dashboard'); return; }

    const checkAdmin = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (!data) navigate('/');
    };
    checkAdmin();
  }, [user, authLoading, navigate]);

  // ── data fetch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        setLoading(true);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);

        const [
          profilesRes,
          newTodayRes,
          newWeekRes,
          swipesRes,
          swipesTodayRes,
          cardTypesRes,
          languageRes,
          vibesRes,
          promoRes,
        ] = await Promise.all([
          supabase.from('profiles').select('premium_status, cards_remaining'),
          supabase.from('profiles').select('id', { count: 'exact' }).gte('created_at', todayStart.toISOString()),
          supabase.from('profiles').select('id', { count: 'exact' }).gte('created_at', weekStart.toISOString()),
          supabase.from('skipped_cards').select('card_type, action', { count: 'exact' }),
          supabase.from('skipped_cards').select('id', { count: 'exact' }).gte('created_at', todayStart.toISOString()),
          supabase.from('skipped_cards').select('card_type, action'),
          supabase.from('skipped_cards').select('language'),
          supabase.from('skipped_cards').select('vibes'),
          supabase.from('promo_codes').select('code, current_uses, max_uses, cards_granted, is_active'),
        ]);

        // Users
        const profiles = profilesRes.data ?? [];
        const freeUsers       = profiles.filter(p => p.premium_status === 'free').length;
        const creditUsers     = profiles.filter(p => p.premium_status === 'credits').length;
        const subscribedUsers = profiles.filter(p => p.premium_status === 'subscribed').length;
        const totalCards      = profiles.reduce((s, p) => s + (p.cards_remaining ?? 0), 0);
        const avgCards        = profiles.length > 0 ? Math.round(totalCards / profiles.length) : 0;

        // Swipes
        const swipes = swipesRes.data ?? [];
        const totalSwipes = swipes.length;
        const skipCount  = swipes.filter(s => s.action === 'skip').length;
        const starCount  = swipes.filter(s => s.action === 'star').length;

        // Card type breakdown
        const typeMap: Record<string, { total: number; skip: number; star: number }> = {};
        for (const s of swipes) {
          const t = s.card_type || 'unknown';
          if (!typeMap[t]) typeMap[t] = { total: 0, skip: 0, star: 0 };
          typeMap[t].total++;
          if (s.action === 'skip') typeMap[t].skip++;
          if (s.action === 'star') typeMap[t].star++;
        }
        const topCardTypes = Object.entries(typeMap)
          .map(([type, v]) => ({
            type,
            count:     v.total,
            skip_rate: Math.round((v.skip / v.total) * 100),
            star_rate: Math.round((v.star / v.total) * 100),
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 12);

        // Language split
        const langMap: Record<string, number> = {};
        for (const r of (languageRes.data ?? [])) {
          const l = r.language || 'unknown';
          langMap[l] = (langMap[l] ?? 0) + 1;
        }
        const languageSplit = Object.entries(langMap)
          .map(([language, count]) => ({ language, count }))
          .sort((a, b) => b.count - a.count);

        // Vibes split
        const vibeMap: Record<string, number> = {};
        for (const r of (vibesRes.data ?? [])) {
          for (const v of (r.vibes ?? [])) {
            vibeMap[v] = (vibeMap[v] ?? 0) + 1;
          }
        }
        const vibesSplit = Object.entries(vibeMap)
          .map(([vibe, count]) => ({ vibe, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

        setStats({
          totalUsers:        profiles.length,
          freeUsers,
          creditUsers,
          subscribedUsers,
          newUsersToday:     newTodayRes.count ?? 0,
          newUsersThisWeek:  newWeekRes.count ?? 0,
          totalSwipes,
          swipesToday:       swipesTodayRes.count ?? 0,
          skipRate:          totalSwipes > 0 ? Math.round((skipCount / totalSwipes) * 100) : 0,
          starRate:          totalSwipes > 0 ? Math.round((starCount / totalSwipes) * 100) : 0,
          topCardTypes,
          languageSplit,
          vibesSplit,
          avgCardsRemaining: avgCards,
          totalCardsInSystem: totalCards,
          promoCodes:        promoRes.data ?? [],
        });
      } catch (e) {
        setError('Failed to load dashboard data. Check your admin role.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60_000); // auto-refresh every minute
    return () => clearInterval(interval);
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-muted-foreground font-display animate-pulse">Loading dashboard...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-destructive font-display font-bold">{error ?? 'No data'}</p>
          <button onClick={() => navigate('/')} className="mt-4 text-sm text-muted-foreground underline">Back to app</button>
        </div>
      </div>
    );
  }

  const maxCardType = Math.max(...stats.topCardTypes.map(t => t.count), 1);
  const maxLang     = Math.max(...stats.languageSplit.map(l => l.count), 1);
  const maxVibe     = Math.max(...stats.vibesSplit.map(v => v.count), 1);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-4 py-3 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur z-10">
        <div>
          <h1 className="font-display font-black text-lg">🤠 Fantito Dashboard</h1>
          <p className="text-[11px] text-muted-foreground">Auto-refreshes every 60s</p>
        </div>
        <button onClick={() => navigate('/')} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← Back to app
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06] px-4">
        {(['overview', 'cards', 'users', 'promos'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2.5 text-[12px] font-display font-semibold capitalize transition-colors border-b-2 -mb-px ${
              tab === t ? 'text-primary border-primary' : 'text-muted-foreground border-transparent'
            }`}>
            {t}
          </button>
        ))}
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-6 pb-16">

        {/* ── OVERVIEW ────────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <>
            <section>
              <h2 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider mb-3">Users</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Total Users" value={stats.totalUsers} />
                <StatCard label="New Today" value={stats.newUsersToday} />
                <StatCard label="New This Week" value={stats.newUsersThisWeek} />
                <StatCard label="Subscribed" value={stats.subscribedUsers} sub={pct(stats.subscribedUsers, stats.totalUsers)} />
              </div>
            </section>

            <section>
              <h2 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider mb-3">Engagement</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Total Swipes" value={stats.totalSwipes} />
                <StatCard label="Swipes Today" value={stats.swipesToday} />
                <StatCard label="Skip Rate" value={`${stats.skipRate}%`} sub="lower is better" />
                <StatCard label="Star Rate" value={`${stats.starRate}%`} sub="higher is better" />
              </div>
            </section>

            <section>
              <h2 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider mb-3">Credits</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatCard label="Avg Cards Left" value={stats.avgCardsRemaining} sub="per user" />
                <StatCard label="Total Cards" value={stats.totalCardsInSystem} sub="in system" />
                <StatCard label="Free Users" value={stats.freeUsers} sub={pct(stats.freeUsers, stats.totalUsers)} />
              </div>
            </section>

            <section>
              <h2 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider mb-3">Languages</h2>
              <div className="bg-card border border-white/[0.08] rounded-2xl p-4 space-y-3">
                {stats.languageSplit.map(l => (
                  <Bar key={l.language} label={l.language.toUpperCase()} value={l.count} max={maxLang} />
                ))}
                {stats.languageSplit.length === 0 && <p className="text-[12px] text-muted-foreground">No data yet</p>}
              </div>
            </section>
          </>
        )}

        {/* ── CARDS ───────────────────────────────────────────────────────── */}
        {tab === 'cards' && (
          <>
            <section>
              <h2 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider mb-3">Card Type Performance</h2>
              <div className="bg-card border border-white/[0.08] rounded-2xl overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left p-3 text-muted-foreground font-display font-semibold">Type</th>
                      <th className="text-right p-3 text-muted-foreground font-display font-semibold">Plays</th>
                      <th className="text-right p-3 text-muted-foreground font-display font-semibold">Skip%</th>
                      <th className="text-right p-3 text-muted-foreground font-display font-semibold">Star%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topCardTypes.map((t, i) => (
                      <tr key={t.type} className={i % 2 === 0 ? 'bg-white/[0.01]' : ''}>
                        <td className="p-3 font-display font-semibold text-foreground">{t.type}</td>
                        <td className="p-3 text-right text-foreground/70">{num(t.count)}</td>
                        <td className={`p-3 text-right font-bold ${t.skip_rate > 50 ? 'text-red-400' : t.skip_rate > 30 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {t.skip_rate}%
                        </td>
                        <td className={`p-3 text-right font-bold ${t.star_rate > 15 ? 'text-yellow-400' : 'text-foreground/50'}`}>
                          {t.star_rate}%
                        </td>
                      </tr>
                    ))}
                    {stats.topCardTypes.length === 0 && (
                      <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No swipe data yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 px-1">Skip% &gt; 50% = reduce this type. Star% &gt; 15% = players love it.</p>
            </section>

            <section>
              <h2 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider mb-3">Vibes Distribution</h2>
              <div className="bg-card border border-white/[0.08] rounded-2xl p-4 space-y-3">
                {stats.vibesSplit.map(v => (
                  <Bar key={v.vibe} label={v.vibe} value={v.count} max={maxVibe} color="hsl(var(--accent))" />
                ))}
                {stats.vibesSplit.length === 0 && <p className="text-[12px] text-muted-foreground">No data yet</p>}
              </div>
            </section>

            <section>
              <h2 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider mb-3">Card Volume by Type</h2>
              <div className="bg-card border border-white/[0.08] rounded-2xl p-4 space-y-3">
                {stats.topCardTypes.map(t => (
                  <Bar key={t.type} label={t.type} value={t.count} max={maxCardType} />
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── USERS ───────────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <>
            <section>
              <h2 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider mb-3">User Breakdown</h2>
              <div className="bg-card border border-white/[0.08] rounded-2xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-display font-semibold text-muted-foreground">Free</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-display font-bold text-foreground">{num(stats.freeUsers)}</span>
                    <span className="text-[11px] text-muted-foreground">({pct(stats.freeUsers, stats.totalUsers)})</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-display font-semibold text-muted-foreground">Credits</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-display font-bold text-foreground">{num(stats.creditUsers)}</span>
                    <span className="text-[11px] text-muted-foreground">({pct(stats.creditUsers, stats.totalUsers)})</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-display font-semibold text-muted-foreground">Subscribed</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-display font-bold" style={{ color: 'hsl(var(--primary))' }}>{num(stats.subscribedUsers)}</span>
                    <span className="text-[11px] text-muted-foreground">({pct(stats.subscribedUsers, stats.totalUsers)})</span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider mb-3">Credits Health</h2>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Avg Cards Remaining" value={stats.avgCardsRemaining} sub="per user" />
                <StatCard label="Total in System" value={stats.totalCardsInSystem} sub="all users combined" />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2 px-1">
                If avg cards remaining drops below 25, consider a promo code campaign to re-engage free users.
              </p>
            </section>

            <section>
              <h2 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider mb-3">Growth</h2>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="New Today" value={stats.newUsersToday} />
                <StatCard label="New This Week" value={stats.newUsersThisWeek} />
              </div>
            </section>
          </>
        )}

        {/* ── PROMOS ──────────────────────────────────────────────────────── */}
        {tab === 'promos' && (
          <section>
            <h2 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider mb-3">Promo Codes</h2>
            <div className="bg-card border border-white/[0.08] rounded-2xl overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left p-3 text-muted-foreground font-display font-semibold">Code</th>
                    <th className="text-right p-3 text-muted-foreground font-display font-semibold">Uses</th>
                    <th className="text-right p-3 text-muted-foreground font-display font-semibold">Cards</th>
                    <th className="text-right p-3 text-muted-foreground font-display font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.promoCodes.map((p, i) => (
                    <tr key={p.code} className={i % 2 === 0 ? 'bg-white/[0.01]' : ''}>
                      <td className="p-3 font-mono text-foreground font-bold">{p.code}</td>
                      <td className="p-3 text-right text-foreground/70">{p.current_uses}/{p.max_uses}</td>
                      <td className="p-3 text-right text-foreground/70">{p.cards_granted}</td>
                      <td className="p-3 text-right">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.is_active ? 'bg-green-500/20 text-green-400' : 'bg-white/[0.06] text-muted-foreground'}`}>
                          {p.is_active ? 'active' : 'inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {stats.promoCodes.length === 0 && (
                    <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No promo codes yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 px-1">
              Create new promo codes directly in the Supabase dashboard → Table Editor → promo_codes.
            </p>
          </section>
        )}

      </div>
    </div>
  );
};

export default Dashboard;