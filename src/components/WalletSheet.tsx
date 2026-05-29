import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Wallet, Sparkles, Gift, Coins, Zap, Tag, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEntitlements } from '@/hooks/useEntitlements';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface WalletSheetProps {
  open: boolean;
  onClose: () => void;
}

const CARDS_PER_GAME = 25;

const WalletSheet = ({ open, onClose }: WalletSheetProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cardsRemaining,
    isSubscribed,
    refresh,
  } = useEntitlements();
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  if (!open) return null;

  const gamesLeft = isSubscribed ? Infinity : Math.floor(cardsRemaining / CARDS_PER_GAME);

  const handleRedeem = async () => {
    if (!user) {
      onClose();
      navigate('/auth?redirect=/');
      return;
    }
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setRedeeming(true);
    try {
      const { data, error } = await supabase.rpc('redeem_promo_code', { _code: trimmed });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; cards_granted?: number };
      if (!result.success) {
        const map: Record<string, string> = {
          invalid_code: 'Code not found',
          expired: 'This code has expired',
          max_uses_reached: 'Code limit reached',
          already_redeemed: 'Already redeemed',
        };
        toast({ title: 'Could not redeem', description: map[result.error ?? ''] ?? result.error, variant: 'destructive' });
      } else {
        toast({ title: '🎉 Unlocked!', description: `${result.cards_granted} cards added.` });
        await refresh();
        setCode('');
      }
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Try again', variant: 'destructive' });
    } finally {
      setRedeeming(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-card border border-white/[0.08] rounded-t-2xl sm:rounded-xl max-h-[92vh] overflow-y-auto shadow-soft">
        {/* Header */}
        <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-white/[0.08] flex items-start justify-between p-5">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Your wallet</h2>
              <p className="text-xs text-muted-foreground">
                {isSubscribed ? 'Unlimited access' : `${cardsRemaining} cards · ${gamesLeft} games left`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Balance */}
          <div className="rounded-xl p-4 bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/20">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-display">
              <Coins className="w-3.5 h-3.5" /> Cards balance
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-display font-bold text-foreground">
                {isSubscribed ? '∞' : cardsRemaining}
              </span>
              <span className="text-sm text-muted-foreground">
                = {isSubscribed ? '∞' : gamesLeft} games
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">1 game = 25 cards · Luck games are always free</p>
          </div>

          {/* Store */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-display font-semibold text-sm text-foreground">Store</h3>
            </div>
            <div className="space-y-2">
              <Offer
                icon={<Gift className="w-4 h-4" />}
                title="Sign up — 125 free cards"
                desc="5 free games, on the house. No card needed."
                cta={user ? 'Done ✓' : 'Sign up'}
                disabled={!!user}
                onClick={() => { onClose(); navigate('/auth?redirect=/'); }}
              />
              <Offer
                icon={<Coins className="w-4 h-4" />}
                title="One-time €1"
                desc="250 cards (10 games). Best for casual nights."
                cta="Soon"
                disabled
                onClick={() => toast({ title: 'Coming soon' })}
              />
              <Offer
                icon={<Zap className="w-4 h-4" />}
                title="Watch 2 ads"
                desc="50 cards (2 games). Instant top-up."
                cta="Soon"
                disabled
                onClick={() => toast({ title: 'Coming soon' })}
              />
              <Offer
                icon={<Sparkles className="w-4 h-4" />}
                title="€9.99 / month"
                desc="Unlimited cards, premium decks, no limits."
                cta="Soon"
                disabled
                onClick={() => toast({ title: 'Coming soon' })}
              />
            </div>
          </section>

          {/* Promo code */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-primary" />
              <h3 className="font-display font-semibold text-sm text-foreground">Promo code</h3>
            </div>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="Enter your code"
                maxLength={50}
                className="flex-1 bg-background border border-white/[0.08] px-3 py-3 text-foreground uppercase font-mono text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/30 rounded-lg transition-colors"
              />
              <button
                onClick={handleRedeem}
                disabled={redeeming || !code.trim()}
                className="bg-primary text-primary-foreground font-display font-semibold px-5 py-3 rounded-lg disabled:opacity-50 active:scale-[0.98] transition-all flex items-center gap-2"
              >
                {redeeming && <Loader2 className="w-4 h-4 animate-spin" />}
                Redeem
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

const Offer = ({
  icon, title, desc, cta, disabled, onClick,
}: { icon: React.ReactNode; title: string; desc: string; cta: string; disabled?: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full text-left bg-background border border-white/[0.08] hover:border-white/20 p-3 rounded-lg transition-colors disabled:opacity-60 disabled:hover:border-white/[0.08] flex items-center justify-between gap-3"
  >
    <div className="flex items-start gap-3">
      <div className="text-primary mt-0.5">{icon}</div>
      <div>
        <div className="font-display font-semibold text-foreground text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </div>
    <span className="text-[10px] font-display font-semibold bg-white/[0.06] border border-white/[0.08] text-muted-foreground px-2 py-1 rounded-md whitespace-nowrap">
      {cta}
    </span>
  </button>
);


export default WalletSheet;