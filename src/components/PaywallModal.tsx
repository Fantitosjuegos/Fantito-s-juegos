import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Tag, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEntitlements } from '@/hooks/useEntitlements';
import { toast } from '@/hooks/use-toast';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  reason?: string;
}

const PaywallModal = ({ open, onClose, reason }: PaywallModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refresh } = useEntitlements();
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  if (!open) return null;

  const requireAuth = () => {
    onClose();
    navigate('/auth?redirect=/');
  };

  const handleRedeem = async () => {
    if (!user) return requireAuth();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast({ title: 'Enter a code', variant: 'destructive' });
      return;
    }
    setRedeeming(true);
    try {
      const { data, error } = await supabase.rpc('redeem_promo_code', { _code: trimmed });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; cards_granted?: number };
      if (!result.success) {
        const map: Record<string, string> = {
          invalid_code: 'Code not found',
          expired: 'This code has expired',
          max_uses_reached: 'This code has reached its limit',
          already_redeemed: 'You already redeemed this code',
          not_authenticated: 'Please sign in first',
        };
        toast({ title: 'Could not redeem', description: map[result.error ?? ''] ?? result.error, variant: 'destructive' });
      } else {
        toast({ title: '🎉 Unlocked!', description: `${result.cards_granted} premium cards added.` });
        await refresh();
        setCode('');
        onClose();
      }
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Try again', variant: 'destructive' });
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-card border border-white/[0.08] rounded-t-2xl sm:rounded-xl p-5 max-h-[90vh] overflow-y-auto shadow-soft">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="font-display text-lg font-bold text-foreground">Premium feature</h2>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {reason && <p className="text-sm text-muted-foreground mb-4">{reason}</p>}

        <div className="space-y-2 mb-5">
          <Option
            title="One-time €1"
            subtitle="Unlock 250 premium cards (5 decks)"
            disabled
            badge="Soon"
            onClick={() => toast({ title: 'Coming soon', description: 'Card payments unlock in the next release.' })}
          />
          <Option
            title="Watch 2 ads"
            subtitle="Unlock 50 cards (1 deck)"
            disabled
            badge="Soon"
            onClick={() => toast({ title: 'Coming soon', description: 'Rewarded ads unlock in the next release.' })}
          />
          <Option
            title="Subscribe €9.99 / month"
            subtitle="Unlimited premium access"
            disabled
            badge="Soon"
            onClick={() => toast({ title: 'Coming soon', description: 'Subscriptions unlock in the next release.' })}
          />
        </div>

        <div className="border-t border-white/[0.08] pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-sm text-foreground">Have a promo code?</h3>
          </div>
          {!user ? (
            <button
              onClick={requireAuth}
              className="w-full bg-primary text-primary-foreground font-display font-semibold py-3 rounded-lg active:scale-[0.98] transition-all"
            >
              Sign up — get 250 free cards 🎁
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="Try FANTITOFF"
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
          )}
        </div>
      </div>
    </div>
  );
};

const Option = ({
  title,
  subtitle,
  badge,
  disabled,
  onClick,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  disabled?: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full text-left bg-background border border-white/[0.08] hover:border-white/20 p-3 rounded-lg transition-colors disabled:opacity-60 disabled:hover:border-white/[0.08] flex items-center justify-between gap-3"
  >
    <div>
      <div className="font-display font-semibold text-foreground text-sm">{title}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
    </div>
    {badge && (
      <span className="text-[10px] font-display font-semibold bg-white/[0.06] border border-white/[0.08] text-muted-foreground px-2 py-1 rounded-md">
        {badge}
      </span>
    )}
  </button>
);

export default PaywallModal;
