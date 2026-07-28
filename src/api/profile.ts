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

/** Profile stats strip: bets / wins / rate / cred (S27). */
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

/** Cred score history for the S29 chart. */
export async function getCredHistory(days = 30) {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const { data, error } = await supabase
    .from('cred_events')
    .select('delta, reason, created_at')
    .eq('user_id', uid!)
    .gte('created_at', since)
    .order('created_at');
  if (error) throw error;
  return data;
}
