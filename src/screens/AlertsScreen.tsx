import React from 'react';
import { Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  NotificationRow,
  EmptyState,
  type NotificationAction,
} from '../components';
import { getNotifications, markRead } from '../api/notifications';
import { useQuery } from '../hooks/useQuery';
import { useRealtime } from '../hooks/useRealtime';

// V2-07 Alerts (design-v2.md §5) — notification feed with contextual actions.
type Alert = {
  id: string;
  avatar: { initials: string; tint?: 'a' | 'b' | 'neutral' };
  text: string;
  meta: string;
  unread?: boolean;
  action?: NotificationAction;
  /** What the alert is *about*. The row's own id is the notification's. */
  betId?: string | null;
  groupId?: string | null;
};

export function AlertsScreen({ navigation }: any) {
  const MOCK: Alert[] = [
    { id: '1', avatar: { initials: 'MC', tint: 'a' }, text: 'Marcus opened "Arsenal top 4". Pick your side.', meta: 'Sunday League · 20m ago', unread: true, action: 'join' },
    { id: '2', avatar: { initials: 'PR', tint: 'b' }, text: 'Your bet vs Priya is ready to resolve.', meta: 'Flatmates · 2h ago', unread: true, action: 'resolve' },
    { id: '3', avatar: { initials: 'DJ', tint: 'neutral' }, text: 'Deej disputed the result of "BBQ rain".', meta: 'Flatmates · 5h ago', action: 'view-dispute' },
    { id: '4', avatar: { initials: 'AB', tint: 'a' }, text: 'Abi joined your group.', meta: 'Sunday League · Yesterday' },
  ];

  const { data: alerts, loading, refetch } = useQuery<Alert[]>(
    async () => (await getNotifications()).map(toAlert),
    MOCK,
  );

  // Alerts are push-shaped: they should land while the screen is open.
  useRealtime('notifications', refetch);

  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title="Alerts" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refetch}
            tintColor={colors.semantic.awaiting}
            colors={[colors.semantic.awaiting]}
          />
        }
      >
        {alerts.length === 0 ? (
          <EmptyState icon="bell" title="You're all caught up" body="New calls, resolutions and disputes land here." />
        ) : (
          alerts.map((a) => (
            <NotificationRow
              key={a.id}
              avatar={a.avatar}
              text={a.text}
              meta={a.meta}
              unread={a.unread}
              action={a.action}
              onPress={() => {
                if (a.unread) markRead(a.id).catch(() => {});
                navigation.navigate('AlertDetail', { id: a.id });
              }}
              // a.id is the notification; the target screens want the bet.
              // Without a bet_id there is nothing to open, so fall back to the
              // alert itself rather than pushing a screen that loads nothing.
              onAction={() => {
                if (a.unread) markRead(a.id).catch(() => {});
                if (!a.betId) return navigation.navigate('AlertDetail', { id: a.id });
                const params = { id: a.betId, betId: a.betId, groupId: a.groupId };
                if (a.action === 'join') navigation.navigate('SideSelection', params);
                else if (a.action === 'resolve') navigation.navigate('Resolution', params);
                else navigation.navigate('DisputeDetail', params);
              }}
            />
          ))
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

// notification_type → the contextual action chip on the row.
const ACTION_FOR: Record<string, NotificationAction> = {
  bet_invite: 'join',
  bet_joined: null,
  resolution_request: 'resolve',
  outcome_proposed: 'resolve',
  dispute_raised: 'view-dispute',
  dispute_resolved: 'view-dispute',
};

function toAlert(n: any): Alert {
  const actor = n.actor ?? {};
  const name: string = actor.display_name ?? actor.handle ?? '';
  return {
    id: n.id,
    avatar: {
      initials: (name || '??').slice(0, 2).toUpperCase(),
      tint: n.type === 'dispute_raised' ? 'b' : 'a',
    },
    text: n.body ? `${n.title} — ${n.body}` : n.title,
    meta: relativeTime(n.created_at),
    unread: !n.read_at,
    action: ACTION_FOR[n.type] ?? null,
    betId: n.bet_id ?? null,
    groupId: n.group_id ?? null,
  };
}

function relativeTime(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.screenGutter,
    gap: spacing[3],
    paddingBottom: spacing[8],
  },
});
