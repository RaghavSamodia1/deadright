import { supabase, uidAsync } from '../lib/supabase';
import type { Bet, BetEvent, BetParticipant, BetSide } from '../types/database';
import { uniqueChannelName } from '../lib/realtime';
import { getSettings } from './settings';

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

  // "Default resolution" in Settings was stored and then never read — this was a
  // hardcoded 'mutual', so every bet used it whatever the setting said. Only
  // consulted when the caller hasn't specified, and 'judge' is ignored because
  // the judge_required constraint needs a judge_id nothing collects yet.
  let fallbackResolution: 'mutual' | 'group_vote' = 'mutual';
  if (!input.resolutionMethod) {
    try {
      const settings = await getSettings();
      if (settings?.default_resolution === 'group_vote') fallbackResolution = 'group_vote';
    } catch {
      // Settings unavailable — 'mutual' is the schema default anyway.
    }
  }
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
      resolution_method: input.resolutionMethod ?? fallbackResolution,
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
       group:groups(name, currency),
       participants:bet_participants(user_id, side)`,
    )
    // A called-off bet is history, not something the group still has to act on.
    .neq('status', 'cancelled')
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
       group:groups(name, currency),
       participants:bet_participants(user_id, side, agreed,
         profile:profiles(handle, display_name, avatar_url)),
       events:bet_events(
         id, actor_id, kind, payload, created_at,
         actor:profiles!bet_events_actor_id_fkey(handle, display_name)
       ),
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
    .channel(uniqueChannelName(`bets:${groupId}`))
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
    .channel(uniqueChannelName(`bet_events:${betId}`))
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'bet_events', filter: `bet_id=eq.${betId}` },
      (payload) => onEvent(payload.new as BetEvent),
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

/**
 * Call a bet off. Creator only, and only while it is still active — after the
 * deadline the honest routes are resolving or disputing.
 *
 * Cancels rather than deletes: other people's participation and timeline hang
 * off the row, and bets carry no delete policy by design.
 */
/**
 * Delete a bet outright. Creator only, and only while nothing has settled on it.
 *
 * Refused once the bet has ledger or form rows: those columns are ON DELETE SET
 * NULL, so they would survive with their link cut — money in everyone's ledger
 * with no bet behind it. Cancel those instead. Participants are notified.
 */
export async function deleteBet(betId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_bet', { p_bet: betId });
  if (error) {
    if (error.message.includes('has_settlement')) {
      throw new Error(
        "This bet has already moved money or form, so it can't be deleted — call it off instead",
      );
    }
    if (error.message.includes('not_allowed')) {
      throw new Error('Only whoever opened the bet can delete it');
    }
    if (error.message.includes('no_such_bet')) {
      throw new Error('That bet no longer exists');
    }
    throw error;
  }
}

export async function cancelBet(betId: string, reason?: string): Promise<Bet> {
  const { data, error } = await supabase.rpc('cancel_bet', {
    p_bet: betId,
    p_reason: reason ?? null,
  });
  if (error) throw error;
  return data;
}
