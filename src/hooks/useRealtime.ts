import { useEffect } from 'react';
import { supabase, isBackendConfigured } from '../lib/supabase';

/**
 * Re-run a refetch whenever rows in `table` change.
 *
 * Bets are meant to feel live — someone taking the other side, a jar violation
 * landing, a dispute opening. Without this the feed only updates when you
 * navigate, which makes a social app feel dead.
 *
 * Requires the table to be added to the `supabase_realtime` publication
 * (Dashboard → Database → Replication), otherwise this is a silent no-op.
 */
export function useRealtime(
  table: string,
  onChange: () => void,
  opts: { filter?: string; enabled?: boolean } = {},
) {
  const { filter, enabled = true } = opts;

  useEffect(() => {
    if (!isBackendConfigured || !enabled) return;

    const channel = supabase
      .channel(`rt:${table}:${filter ?? 'all'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, ...(filter ? { filter } : {}) },
        () => onChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter, enabled]);
}
