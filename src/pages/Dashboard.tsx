import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { StatsService } from '@/services/statsService';
import { EmptyState } from '@/components/ui/EmptyState';
import { 
  Loader2, RefreshCw, AlertCircle, ArrowLeft, 
  Layers, Users, Sparkles, Receipt 
} from 'lucide-react';

// ─── StatCard & Bar Components (Keep in this file for portability) ───
const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="bg-card border border-white/[0.08] rounded-2xl p-4 flex flex-col gap-1">
    <p className="text-[10px] text-muted-foreground font-display font-bold uppercase tracking-widest">{label}</p>
    <p className="text-2xl font-display font-black text-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    {sub && <p className="text-[10px] text-muted-foreground font-medium">{sub}</p>}
  </div>
);

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Awaited<ReturnType<typeof StatsService.fetchAdminStats>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'cards' | 'users' | 'promos'>('overview');

  const loadData = async () => {
    try {
      const data = await StatsService.fetchAdminStats();
      setStats(data);
    } catch (e) {
      console.error("Dashboard Load Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
    if (user) {
      loadData();
      const interval = setInterval(loadData, 60000);
      return () => clearInterval(interval);
    }
  }, [user, authLoading]);

  if (authLoading || (loading && !stats)) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-white/[0.06] p-4 flex items-center justify-between">
        <div>
          <h1 className="font-display font-black text-lg">🤠 Admin Portal</h1>
          <button onClick={loadData} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary">
            <RefreshCw className="w-3 h-3" /> Sync Data
          </button>
        </div>
        <button onClick={() => navigate('/')} className="p-2 bg-white/[0.05] rounded-full hover:bg-white/[0.1] transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
      </header>

      <div className="flex border-b border-white/[0.06] px-2 mt-2">
        {(['overview', 'cards', 'users', 'promos'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 text-[11px] font-display font-bold uppercase tracking-wider ${tab === t ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>
            {t}
          </button>
        ))}
      </div>

      <main className="p-4 max-w-3xl mx-auto space-y-6">
        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Users" value={stats?.totalUsers ?? 0} />
            <StatCard label="New Today" value={stats?.newUsersToday ?? 0} />
            <StatCard label="Total Swipes" value={stats?.totalSwipes ?? 0} />
            <StatCard label="Skip Rate" value={`${stats?.skipRate ?? 0}%`} />
          </div>
        )}

        {/* CARDS TAB WITH EMPTY STATE */}
        {tab === 'cards' && (stats?.totalSwipes === 0 ? (
          <EmptyState 
            icon={Layers} 
            title="No Data Yet" 
            description="The card engine is silent. Wait for players to start their first swipe session."
          />
        ) : (
          <div className="text-sm text-muted-foreground">Card performance details would load here...</div>
        ))}
        
        {/* OTHER TABS */}
        {tab === 'users' && <EmptyState icon={Users} title="User Analytics" description="Detailed user breakdown coming soon." />}
        {tab === 'promos' && <EmptyState icon={Receipt} title="No Promos" description="No promo codes have been used yet." />}
      </main>
    </div>
  );
};

export default Dashboard;