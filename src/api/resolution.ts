import { supabase } from '../lib/supabase';
import type { Bet, BetSide, DisputeReason } from '../types/database';

/** FLOW 6 step 1 — any participant proposes the outcome. */
export async function proposeOutcome(
  betId: string,
  side: BetSide,
  evidence?: string,
): Promise<Bet> {
  const { data, error } = await supabase.rpc('propose_outcome', {
    p_bet: betId,
    p_side: side,
    p_evidence: evidence ?? null,
  });
  if (error) throw error;
  return data;
}

/** FLOW 6 step 2 — losing-side agreement; resolves when all losers agree. */
export async function agreeOutcome(betId: string): Promise<Bet> {
  const { data, error } = await supabase.rpc('agree_outcome', { p_bet: betId });
  if (error) throw error;
  return data;
}

/** FLOW 6 edge case — 5-minute undo window, resolver only. */
export async function undoResolution(betId: string): Promise<Bet> {
  const { data, error } = await supabase.rpc('undo_resolution', { p_bet: betId });
  if (error) throw error;
  return data;
}

/** FLOW 7 — raise a dispute (reason required; friction is intentional).
 *  Bet status flip + timeline + notifications happen via DB trigger. */
export async function raiseDispute(betId: string, reason: DisputeReason, detail?: string) {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  const { data, error } = await supabase
    .from('disputes')
    .insert({ bet_id: betId, raised_by: uid, reason, detail: detail ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** FLOW 7 — cast a vote in a group-vote dispute. */
export async function castDisputeVote(disputeId: string, side: BetSide) {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  const { error } = await supabase
    .from('dispute_votes')
    .insert({ dispute_id: disputeId, user_id: uid, side });
  if (error) throw error;
}

export async function getDispute(betId: string) {
  const { data, error } = await supabase
    .from('disputes')
    .select('*, votes:dispute_votes(user_id, side)')
    .eq('bet_id', betId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Evidence upload: storage first, then row. */
export async function addEvidence(betId: string, note?: string, fileUri?: string) {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  let file_path: string | null = null;

  if (fileUri) {
    const ext = fileUri.split('.').pop() ?? 'jpg';
    file_path = `${betId}/${Date.now()}.${ext}`;
    const file = await fetch(fileUri).then((r) => r.blob());
    const { error: upError } = await supabase.storage
      .from('evidence')
      .upload(file_path, file);
    if (upError) throw upError;
  }

  const { data, error } = await supabase
    .from('bet_evidence')
    .insert({ bet_id: betId, user_id: uid, note: note ?? null, file_path })
    .select()
    .single();
  if (error) throw error;
  return data;
}
