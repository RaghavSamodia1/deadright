import { supabase } from '../lib/supabase';
import type { Group } from '../types/database';

/** FLOW 3 create path — creates group + admin membership + invite code. */
export async function createGroup(name: string, emoji = '⚽'): Promise<Group> {
  const { data, error } = await supabase.rpc('create_group', {
    p_name: name,
    p_emoji: emoji,
  });
  if (error) throw error;
  return data;
}

/** FLOW 3 join path — idempotent (already-a-member deep links just succeed). */
export async function joinGroupByCode(code: string): Promise<Group> {
  const { data, error } = await supabase.rpc('join_group_by_code', { p_code: code });
  if (error) {
    if (error.message.includes('invalid_code')) {
      throw new Error("That code doesn't match any group — codes are 6 characters");
    }
    throw error;
  }
  return data;
}

export async function getMyGroups() {
  const { data, error } = await supabase
    .from('groups')
    .select('*, members:group_members(user_id, role, profile:profiles(handle, display_name, avatar_url))')
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function getGroup(groupId: string) {
  const { data, error } = await supabase
    .from('groups')
    .select('*, members:group_members(user_id, role, profile:profiles(handle, display_name, avatar_url))')
    .eq('id', groupId)
    .single();
  if (error) throw error;
  return data;
}

export async function leaveGroup(groupId: string) {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', uid!);
  if (error) throw error;
}
