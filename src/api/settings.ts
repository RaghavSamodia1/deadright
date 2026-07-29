import { supabase, uidAsync } from '../lib/supabase';

export interface UserSettings {
  user_id: string;
  notify_new_bets: boolean;
  notify_resolutions: boolean;
  notify_disputes: boolean;
  notify_jar: boolean;
  notify_cred: boolean;
  notify_marketing: boolean;
  private_profile: boolean;
  show_ledger: boolean;
  discoverable: boolean;
  default_resolution: 'mutual' | 'group_vote' | 'judge';
  currency: string;
  auto_settle: boolean;
  jar_cap_cents: number;
}

/** Reads your settings, creating the row on first use (RPC does both). */
export async function getSettings(): Promise<UserSettings> {
  const { data, error } = await supabase.rpc('get_or_create_settings');
  if (error) throw error;
  return data;
}

/** Patch any subset — toggles save individually as they're flipped. */
export async function updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
  const user_id = await uidAsync();
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({ user_id, ...patch }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── Blocking ─────────────────────────────────────────────────────────────────

export async function getBlockedUsers() {
  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id, created_at, blocked:profiles!blocks_blocked_id_fkey(handle, display_name, avatar_url)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function blockUser(blockedId: string) {
  const blocker_id = await uidAsync();
  const { error } = await supabase
    .from('blocks')
    .insert({ blocker_id, blocked_id: blockedId });
  if (error) throw error;
}

export async function unblockUser(blockedId: string) {
  const blocker_id = await uidAsync();
  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', blocker_id)
    .eq('blocked_id', blockedId);
  if (error) throw error;
}
