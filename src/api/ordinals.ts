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
export async function submitRanking(betId: string, orderedOptionIds: string[]) {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  const rows = orderedOptionIds.map((option_id, i) => ({
    bet_id: betId,
    user_id: uid!,
    option_id,
    rank: i + 1,
  }));
  const { error } = await supabase
    .from('bet_rankings')
    .upsert(rows, { onConflict: 'bet_id,user_id,option_id' });
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
