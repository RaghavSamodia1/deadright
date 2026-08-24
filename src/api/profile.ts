import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/database';

export async function getMyProfile(): Promise<Profile> {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid!)
    .single();
  if (error) throw error;
  return data;
}

export async function getProfile(handle: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('handle', handle)
    .single();
  if (error) throw error;
  return data;
}

export async function updateProfile(
  patch: Partial<Pick<Profile, 'handle' | 'display_name' | 'avatar_url' | 'bio' | 'is_public'>>,
): Promise<Profile> {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', uid!)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Profile stats strip: bets / wins / rate / form (S27). */
export async function getStats(userId: string) {
  const { data, error } = await supabase
    .from('bet_participants')
    .select('side, bet:bets!inner(status, winning_side)')
    .eq('user_id', userId)
    .eq('bet.status', 'resolved');
  if (error) throw error;

  const total = data?.length ?? 0;
  const wins = (data ?? []).filter(
    (r: any) => r.bet.winning_side === r.side,
  ).length;
  return {
    total,
    wins,
    losses: total - wins,
    winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
  };
}

/** Form score history for the S29 chart. */
export async function getFormHistory(days = 30) {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const { data, error } = await supabase
    .from('form_events')
    .select('delta, reason, created_at')
    .eq('user_id', uid!)
    .gte('created_at', since)
    .order('created_at');
  if (error) throw error;
  return data;
}

/** Search people by handle or display name (Search screen). */
export async function searchProfiles(query: string) {
  const q = query.trim();
  if (q.length < 2) return [];
  // Goes through the RPC rather than the table: it honours the Discoverable
  // setting and both directions of a block, and it does so in the database, so
  // the rule cannot be sidestepped with the anon key that ships in the bundle.
  const { data, error } = await supabase.rpc('search_profiles', { p_query: q });
  if (error) throw error;
  return data ?? [];
}

/** Search bets you can see, by title. */
export async function searchBets(query: string) {
  const q = query.trim();
  if (q.length < 2) return [];
  const { data, error } = await supabase.rpc('search_bets', { p_query: q });
  if (error) throw error;
  return data ?? [];
}

// ── Avatar ───────────────────────────────────────────────────────────────────

/**
 * Upload a profile photo and point the profile at it.
 *
 * Same shape as evidence upload, including the reason it reads the file as
 * base64 first: `fetch(uri).blob()` is unreliable in React Native and uploads a
 * 0-byte file often enough to be untrustworthy.
 *
 * The old file is removed after the new one is live, not before — a failed
 * upload should leave you with the photo you already had rather than none.
 */
export async function uploadAvatar(fileUri: string): Promise<string> {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  if (!uid) throw new Error('not_authenticated');

  const ext = (fileUri.split('.').pop() ?? 'jpg').toLowerCase().split('?')[0];
  const path = `${uid}/${Date.now()}.${ext}`;
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { error: upError } = await supabase.storage
    .from('avatars')
    .upload(path, decode(base64), {
      contentType:
        ext === 'png' ? 'image/png' : ext === 'heic' ? 'image/heic' : ext === 'webp' ? 'image/webp' : 'image/jpeg',
      upsert: false,
    });
  if (upError) throw upError;

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const url = data.publicUrl;

  const previous = (await getMyProfile()).avatar_url;
  await updateProfile({ avatar_url: url });
  await removeStoredAvatar(previous);
  return url;
}

/** Drop the photo and go back to the drawn face. */
export async function removeAvatar(): Promise<void> {
  const previous = (await getMyProfile()).avatar_url;
  await updateProfile({ avatar_url: null });
  await removeStoredAvatar(previous);
}

/**
 * Best-effort cleanup of the file behind an old avatar URL. A leftover object
 * costs a few KB and nothing else, so a failure here is not worth surfacing to
 * somebody who has already successfully changed their photo.
 */
async function removeStoredAvatar(url: string | null | undefined): Promise<void> {
  if (!url) return;
  const marker = '/avatars/';
  const at = url.indexOf(marker);
  if (at === -1) return;
  const path = url.slice(at + marker.length).split('?')[0];
  if (!path) return;
  try {
    await supabase.storage.from('avatars').remove([path]);
  } catch {
    // Orphaned file; harmless.
  }
}

/**
 * Is this handle free?
 *
 * handle_available() has existed since 00034 and nothing called it, so the edit
 * screen let you type a taken handle and find out from a unique-constraint
 * violation on save.
 */
export async function isHandleAvailable(handle: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('handle_available', { p_handle: handle });
  if (error) throw error;
  return data === true;
}

/**
 * Your record against one person, over the bets you were both in.
 *
 * Their overall win rate cannot honestly be shown on a friend's profile:
 * bet_participants is RLS-scoped, so counting it from here would only see the
 * bets *you* can see and would quietly understate them. A head-to-head has no
 * such problem — you were in every bet it counts, by definition — and it is the
 * more interesting number on somebody else's page anyway.
 *
 * This screen used to show a hardcoded 7-4 against whoever you opened.
 */
export async function getHeadToHead(otherUserId: string) {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  if (!uid) return { played: 0, mine: 0, theirs: 0 };

  const { data, error } = await supabase
    .from('bet_participants')
    .select('bet_id, user_id, side, is_winner, bet:bets!inner(status, winning_side, call_kind)')
    .in('user_id', [uid, otherUserId])
    .eq('bet.status', 'resolved');
  if (error) throw error;

  const byBet = new Map<string, any[]>();
  for (const r of (data ?? []) as any[]) {
    byBet.set(r.bet_id, [...(byBet.get(r.bet_id) ?? []), r]);
  }

  // A closest-call bet has no winning_side — everyone is stored on side a and
  // the result lives in is_winner (00036).
  const won = (row: any) =>
    row.bet?.call_kind != null ? row.is_winner === true : row.side === row.bet?.winning_side;

  let played = 0, mine = 0, theirs = 0;
  for (const rows of byBet.values()) {
    const me = rows.find((r) => r.user_id === uid);
    const them = rows.find((r) => r.user_id === otherUserId);
    if (!me || !them) continue; // only one of us was in it
    played += 1;
    if (won(me)) mine += 1;
    if (won(them)) theirs += 1;
  }
  return { played, mine, theirs };
}
