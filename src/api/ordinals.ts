import { supabase } from '../lib/supabase';
import type { BetOption } from '../types/database';

/** Add ranked options to an ordinal bet (creator, while active). */
export async function addOptions(betId: string, labels: string[]): Promise<BetOption[]> {
  const rows = labels.map((label, i) => ({ bet_id: betId, label, position: i + 1 }));
  const { data, error } = await supabase.from('bet_options').insert(rows).select();
  if (error) throw error;
  return data;
}

export async function getOptions(betId: string): Promise<BetOption[]> {
  const { data, error } = await supabase
    .from('bet_options')
    .select('*')
    .eq('bet_id', betId)
    .order('position');
  if (error) throw error;
  return data;
}

/** Lock in my predicted order — array of option ids, best first. */
/**
 * Ranking is also how you join an ordinal bet, so it goes through an RPC that
 * does both atomically. The direct upsert this replaced could not satisfy the
 * bet_rankings insert policy — that policy requires an existing
 * bet_participants row, which only the RPC creates.
 */
export async function submitRanking(betId: string, orderedOptionIds: string[]) {
  const { error } = await supabase.rpc('submit_ranking', {
    p_bet: betId,
    p_options: orderedOptionIds,
  });
  if (error) throw error;
}

/** Set the actual final order (resolution), then fetch Kendall-tau scores. */
export async function resolveOrdinal(betId: string, finalOrderedOptionIds: string[]) {
  await Promise.all(
    finalOrderedOptionIds.map((id, i) =>
      supabase.from('bet_options').update({ final_position: i + 1 }).eq('id', id),
    ),
  );
  const { data, error } = await supabase.rpc('score_ordinal_bet', { p_bet: betId });
  if (error) throw error;
  return data as { user_id: string; tau: number; exact_hits: number }[];
}
