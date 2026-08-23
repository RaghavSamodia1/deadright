import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, Avatar, Button } from '../components';
import { supabase } from '../lib/supabase';
import { markRead } from '../api/notifications';
import { useQuery } from '../hooks/useQuery';

// What each notification type means, and where it should send you.
const ROUTE_FOR: Record<string, { label: string; screen: string } | undefined> = {
  bet_invite: { label: 'Pick your side', screen: 'SideSelection' },
  bet_joined: { label: 'View the bet', screen: 'BetDetail' },
  resolution_request: { label: 'Resolve it', screen: 'Resolution' },
  outcome_proposed: { label: 'Agree or dispute', screen: 'BetDetail' },
  dispute_raised: { label: 'See the dispute', screen: 'DisputeDetail' },
  dispute_resolved: { label: 'See the outcome', screen: 'BetDetail' },
  bet_won: { label: 'See the bet', screen: 'BetDetail' },
  bet_lost: { label: 'See the bet', screen: 'BetDetail' },
  jar_violation: { label: 'Open the jar', screen: 'CookieJar' },
  ledger_reset: { label: 'Open the ledger', screen: 'Ledger' },
  jar_cap_reached: { label: 'Open the jar', screen: 'CookieJar' },
  group_joined: { label: 'Open the group', screen: 'Group' },
  form_change: { label: 'See your profile', screen: 'Profile' },
};

export function AlertDetailScreen({ navigation, route }: any) {
  const id: string | undefined = route?.params?.id;

  const { data: alert } = useQuery<any>(
    async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('notifications')
        .select('*, actor:profiles!notifications_actor_id_fkey(handle, display_name, avatar_url)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (data && !data.read_at) markRead(data.id).catch(() => {});
      return data;
    },
    null,
    [id],
  );

  const actorName: string =
    alert?.actor?.display_name ?? alert?.actor?.handle ?? 'DeadRight';
  const action = ROUTE_FOR[alert?.type];

  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title="Alert" onBack={() => navigation.goBack()} />
      <View style={styles.root}>
        <View style={styles.card}>
          <Avatar
            size="lg"
            initials={actorName.slice(0, 2).toUpperCase()}
            uri={alert?.actor?.avatar_url ?? undefined}
            tint="a"
          />
          <Text style={styles.text}>{alert?.title ?? 'Alert'}</Text>
          <Text style={styles.meta}>
            {alert?.created_at ? relativeTime(alert.created_at) : ''}
          </Text>
        </View>

        {alert?.body && (
          <View style={styles.detail}>
            <Text style={styles.q}>DETAILS</Text>
            <Text style={styles.body}>{alert.body}</Text>
          </View>
        )}

        <View style={styles.footer}>
          {action && (
            <Button
              label={action.label}
              // push, not replace: replacing dropped this screen from the stack,
              // so the target had nothing to go back to — and for the modal
              // targets (SideSelection) the sheet's Cancel was the only way out.
              onPress={() =>
                navigation.navigate(action.screen, {
                  id: alert?.bet_id ?? alert?.group_id,
                  betId: alert?.bet_id,
                  groupId: alert?.group_id,
                })
              }
              fullWidth
            />
          )}
          <Button label="Back to alerts" onPress={() => navigation.goBack()} variant="secondary" fullWidth />
        </View>
      </View>
    </ScreenBackground>
  );
}

function relativeTime(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.round(hrs / 24)}d ago`;
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.screenGutter, gap: spacing[5] },
  card: {
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[6],
    marginTop: spacing[3],
  },
  text: {
    fontFamily: 'Barlow-Bold',
    fontSize: 17,
    lineHeight: 23,
    color: colors.text.primary,
    textAlign: 'center',
  },
  meta: { fontFamily: 'Inter-Regular', fontSize: 12, color: colors.text.tertiary },
  detail: { gap: spacing[2] },
  q: { fontFamily: 'Barlow-SemiBold', fontSize: 11, letterSpacing: 2, color: colors.semantic.awaiting },
  body: { fontFamily: 'Inter-Regular', fontSize: 15, lineHeight: 22, color: colors.text.secondary },
  footer: { gap: spacing[3], marginTop: 'auto', paddingBottom: spacing[4] },
});
