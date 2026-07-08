import { supabase } from '@/integrations/supabase/client';

export const StatsService = {
  async fetchAdminStats() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const week = new Date(); week.setDate(week.getDate() - 7);

    const [profiles, swipes, promos] = await Promise.all([
      supabase.from('profiles').select('premium_status, cards_remaining, created_at'),
      supabase.from('skipped_cards').select('card_type, action, language, vibes, created_at'),
      supabase.from('promo_codes').select('*')
    ]);

    const pData = profiles.data || [];
    const sData = swipes.data || [];
    const totalSwipes = sData.length;

    return {
      totalUsers: pData.length,
      freeUsers: pData.filter(p => p.premium_status === 'free').length,
      creditUsers: pData.filter(p => p.premium_status === 'credits').length,
      subscribedUsers: pData.filter(p => p.premium_status === 'subscribed').length,
      newUsersToday: pData.filter(p => new Date(p.created_at) >= today).length,
      newUsersThisWeek: pData.filter(p => new Date(p.created_at) >= week).length,
      totalSwipes,
      swipesToday: sData.filter(s => new Date(s.created_at) >= today).length,
      skipRate: totalSwipes ? Math.round((sData.filter(s => s.action === 'skip').length / totalSwipes) * 100) : 0,
      starRate: totalSwipes ? Math.round((sData.filter(s => s.action === 'star').length / totalSwipes) * 100) : 0,
      avgCardsRemaining: pData.length ? Math.round(pData.reduce((s, p) => s + (p.cards_remaining || 0), 0) / pData.length) : 0,
      totalCardsInSystem: pData.reduce((s, p) => s + (p.cards_remaining || 0), 0),
      topCardTypes: Object.entries(sData.reduce((acc: any, s) => {
        const t = s.card_type || 'unknown';
        if (!acc[t]) acc[t] = { total: 0, skip: 0, star: 0 };
        acc[t].total++;
        if (s.action === 'skip') acc[t].skip++;
        if (s.action === 'star') acc[t].star++;
        return acc;
      }, {})).map(([type, v]: any) => ({ type, count: v.total, skip_rate: Math.round((v.skip/v.total)*100), star_rate: Math.round((v.star/v.total)*100) })).sort((a,b) => b.count - a.count),
      languageSplit: Object.entries(sData.reduce((acc: any, s) => { acc[s.language || 'unknown'] = (acc[s.language || 'unknown'] || 0) + 1; return acc; }, {})).map(([language, count]: any) => ({ language, count })).sort((a,b) => b.count - a.count),
      vibesSplit: Object.entries(sData.reduce((acc: any, s) => { (s.vibes || []).forEach((v: string) => acc[v] = (acc[v] || 0) + 1); return acc; }, {})).map(([vibe, count]: any) => ({ vibe, count })).sort((a,b) => b.count - a.count),
      promoCodes: promos.data || []
    };
  }
};