import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
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
    .select(
      `*,
       votes:dispute_votes(user_id, side),
       bet:bets(title, winning_side, status),
       raiser:profiles!disputes_raised_by_fkey(handle, display_name)`,
    )
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
    const ext = (fileUri.split('.').pop() ?? 'jpg').toLowerCase();
    file_path = `${betId}/${Date.now()}.${ext}`;

    // NB: `fetch(uri).blob()` is unreliable in React Native — it frequently
    // uploads a 0-byte file. Read the local file as base64 and hand Supabase a
    // real ArrayBuffer instead.
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const { error: upError } = await supabase.storage
      .from('evidence')
      .upload(file_path, decode(base64), {
        contentType: ext === 'png' ? 'image/png' : ext === 'heic' ? 'image/heic' : 'image/jpeg',
        upsert: false,
      });
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

/**
 * The evidence bucket is private, so images need a short-lived signed URL.
 * Returns null for rows that are note-only (no file).
 */
export async function getEvidenceUrl(filePath: string | null, expiresInSec = 3600) {
  if (!filePath) return null;
  const { data, error } = await supabase.storage
    .from('evidence')
    .createSignedUrl(filePath, expiresInSec);
  if (error) throw error;
  return data.signedUrl;
}

export async function listEvidence(betId: string) {
  const { data, error } = await supabase
    .from('bet_evidence')
    .select('*, author:profiles!bet_evidence_user_id_fkey(handle, display_name)')
    .eq('bet_id', betId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * The Form actually awarded for a bet, for the win screen.
 *
 * The screen used to show a hardcoded "+12 Form" because nothing passed it a
 * real number. Returns null when the event has not landed yet, so the caller
 * can say nothing rather than invent a figure.
 */
export async function getFormDelta(betId: string): Promise<number | null> {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from('form_events')
    .select('delta')
    .eq('bet_id', betId)
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data?.delta ?? null;
}
