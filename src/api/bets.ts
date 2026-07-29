import { supabase, uidAsync } from '../lib/supabase';
import type { Bet, BetEvent, BetParticipant, BetSide } from '../types/database';

export interface CreateBetInput {
  groupId: string | null;
  title: string;
  // Mirrors the bet_type enum — 'ordinal' was missing, so ranking bets
  // couldn't be created through this layer at all.
  type?: 'prediction' | 'dare' | 'open' | 'ordinal';
  stakeKind?: 'money' | 'dare' | 'secret';
  stakeAmountCents?: number;
  dareForfeit?: string;
  deadline: Date;
  resolutionMethod?: 'mutual' | 'group_vote' | 'judge';
  judgeId?: string;
  privacy?: 'group' | 'link';
}

/** FLOW 4 — publish. Only title is truly required; everything else defaults. */
export async function createBet(input: CreateBetInput): Promise<Bet> {
  const creator_id = await uidAsync();
  const { data, error } = await supabase
    .from('bets')
    .insert({
      group_id: input.groupId,
      creator_id,
      title: input.title,
      type: input.type ?? 'prediction',
      stake_kind: input.stakeKind ?? 'money',
      stake_amount_cents: input.stakeAmountCents ?? (input.stakeKind === 'money' || !input.stakeKind ? 500 : null),
      dare_forfeit: input.dareForfeit ?? null,
      deadline: input.deadline.toISOString(),
      resolution_method: input.resolutionMethod ?? 'mutual',
      judge_id: input.judgeId ?? null,
      privacy: input.privacy ?? 'group',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Feed query: bets in my groups, newest first, participants embedded. */
export async function getFeed(groupId?: string) {
  let q = supabase
    .from('bets')
    .select(
      `*,
       creator:profiles!bets_creator_id_fkey(handle, display_name, avatar_url),
       participants:bet_participants(user_id, side)`,
    )
    .order('created_at', { ascending: false })
    .limit(30);
  if (groupId) q = q.eq('group_id', groupId);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function getBet(betId: string) {
  const { data, error } = await supabase
    .from('bets')
    .select(
      `*,
       creator:profiles!bets_creator_id_fkey(handle, display_name, avatar_url),
       participants:bet_participants(user_id, side, agreed,
         profile:profiles(handle, display_name, avatar_url)),
       events:bet_events(id, actor_id, kind, payload, created_at),
       evidence:bet_evidence(id, user_id, note, file_path, created_at)`,
    )
    .eq('id', betId)
    .single();
  if (error) throw error;
  return data;
}

/** FLOW 5 — join a side (≤3 taps from feed). Side switches log timeline events. */
export async function joinSide(betId: string, side: BetSide): Promise<BetParticipant> {
  const user_id = await uidAsync();
  const { data, error } = await supabase
    .from('bet_participants')
    .upsert({ bet_id: betId, user_id, side }, { onConflict: 'bet_id,user_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Realtime: feed updates for a group (card states flip live). */
export function subscribeToBets(groupId: string, onChange: () => void) {
  const channel = supabase
    .channel(`bets:${groupId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bets', filter: `group_id=eq.${groupId}` },
      onChange,
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

/** Realtime: a single bet's timeline (detail screen). */
export function subscribeToBetEvents(betId: string, onEvent: (e: BetEvent) => void) {
  const channel = supabase
    .channel(`bet_events:${betId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'bet_events', filter: `bet_id=eq.${betId}` },
      (payload) => onEvent(payload.new as BetEvent),
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
