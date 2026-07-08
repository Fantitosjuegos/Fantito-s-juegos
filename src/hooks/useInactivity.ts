import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useInactivity = (timeout = 10 * 60 * 1000) => {
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/auth';
      }, timeout);
    };

    // Events to track activity
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      clearTimeout(timer);
    };
  }, [timeout]);
};