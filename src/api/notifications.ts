import { supabase } from '../lib/supabase';
import type { Notification } from '../types/database';
import { uniqueChannelName } from '../lib/realtime';

export async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:profiles!notifications_actor_id_fkey(handle, display_name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data;
}

export async function markRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllRead() {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', uid!)
    .is('read_at', null);
  if (error) throw error;
}

export async function getUnreadCount(): Promise<number> {
  const uid = (await supabase.auth.getSession()).data.session?.user.id;
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', uid!)
    .is('read_at', null);
  if (error) throw error;
  return count ?? 0;
}

/** Realtime badge updates (tab bar alert count). */
export function subscribeToNotifications(
  userId: string,
  onNew: (n: Notification) => void,
) {
  const channel = supabase
    .channel(uniqueChannelName(`notifications:${userId}`))
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onNew(payload.new as Notification),
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
