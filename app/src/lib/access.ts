import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { supabase } from './supabase';

export type Access = {
  has_access: boolean; trial_ends_at: string | null; status: string;
  current_period_end: string | null; cancel_at: string | null; cancel_at_period_end: boolean;
};

export function useAccess() {
  const [access, setAccess] = useState<Access | null>(null);
  const refresh = useCallback(async () => {
    const { data } = await supabase.rpc('my_access');
    if (data) setAccess(data as Access);
  }, []);
  useEffect(() => {
    void refresh();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && void refresh());
    return () => sub.remove();
  }, [refresh]);
  return { access, refresh };
}
