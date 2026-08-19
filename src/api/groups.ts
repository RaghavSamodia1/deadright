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

/**
 * Promote or demote a member. Admin only, and the database refuses to demote
 * the last admin — a group with nobody who can administer it cannot be repaired
 * from inside the app.
 */
export async function setMemberRole(
  groupId: string,
  userId: string,
  role: 'member' | 'admin',
): Promise<void> {
  const { error } = await supabase.rpc('set_member_role', {
    p_group: groupId,
    p_user: userId,
    p_role: role,
  });
  if (error) throw error;
}

/**
 * Set the group's currency — the unit every amount inside it is read in.
 *
 * Admin only (the database enforces it too). This relabels rather than converts:
 * a jar holding 500 cents becomes ₹5 instead of $5, so callers should confirm
 * with the user when the group already has money recorded.
 */
export async function setGroupCurrency(groupId: string, currency: string) {
  const { error } = await supabase.rpc('set_group_currency', {
    p_group: groupId,
    p_currency: currency.toUpperCase(),
  });
  if (error) {
    if (error.message.includes('admin_only')) {
      throw new Error('Only a group admin can change the currency');
    }
    if (error.message.includes('invalid_currency')) {
      throw new Error('That currency code looks wrong');
    }
    throw error;
  }
}

export interface GroupPeek {
  id: string;
  name: string;
  emoji: string | null;
  member_count: number;
}

/**
 * What a group is, from its invite code, without joining it.
 *
 * The join screen used to fake this — a hardcoded "Flatmates" card that
 * appeared for any six characters, next to an error saying the code matched
 * nothing. This returns the real group or nothing at all.
 */
export async function peekGroup(code: string): Promise<GroupPeek | null> {
  const c = code.trim();
  if (c.length !== 6) return null;
  const { data, error } = await supabase.rpc('peek_group', { p_code: c });
  if (error) throw error;
  return (data && data[0]) ?? null;
}
