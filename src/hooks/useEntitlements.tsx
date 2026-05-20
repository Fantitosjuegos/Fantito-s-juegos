import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type MoneyAllocation = 'reinvest' | 'ferrari';

export interface Entitlements {
  isPremium: boolean;
  isSubscribed: boolean;
  cardsRemaining: number;
  premiumStatus: 'free' | 'credits' | 'subscribed';
  moneyAllocation: MoneyAllocation;
  setMoneyAllocation: (v: MoneyAllocation) => Promise<void>;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const useEntitlements = (): Entitlements => {
  const { user } = useAuth();
  const [cardsRemaining, setCardsRemaining] = useState(0);
  const [premiumStatus, setPremiumStatus] = useState<'free' | 'credits' | 'subscribed'>('free');
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [moneyAllocation, setMoneyAllocationState] = useState<MoneyAllocation>('reinvest');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      // Anonymous baseline: 25 free cards (1 deck = 1 free game) before signup is required.
      setCardsRemaining(25);
      setPremiumStatus('credits');
      setSubscriptionEnd(null);
      setMoneyAllocationState('reinvest');
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('cards_remaining, premium_status, subscription_end_date, money_allocation')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setCardsRemaining(data.cards_remaining ?? 0);
      setPremiumStatus((data.premium_status ?? 'free') as 'free' | 'credits' | 'subscribed');
      setSubscriptionEnd(data.subscription_end_date ?? null);
      setMoneyAllocationState((data.money_allocation ?? 'reinvest') as MoneyAllocation);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setMoneyAllocation = useCallback(async (v: MoneyAllocation) => {
    if (!user) return;
    setMoneyAllocationState(v);
    await supabase.from('profiles').update({ money_allocation: v }).eq('user_id', user.id);
  }, [user]);

  const isSubscribed =
    premiumStatus === 'subscribed' &&
    !!subscriptionEnd &&
    new Date(subscriptionEnd) > new Date();
  const isPremium = isSubscribed || cardsRemaining > 0;

  return { isPremium, isSubscribed, cardsRemaining, premiumStatus, moneyAllocation, setMoneyAllocation, loading, refresh };
};