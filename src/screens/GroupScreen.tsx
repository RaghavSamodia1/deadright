import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  BentoTile,
  AvatarStack,
  BetCard,
  Button,
  type BetCardData,
} from '../components';
import { getGroup } from '../api/groups';
import { getFeed } from '../api/bets';
import { getJar } from '../api/jar';
import { useQuery } from '../hooks/useQuery';
import { uidOrNull } from '../lib/supabase';
import { toBetCard } from '../lib/mappers';
import { plural } from '../lib/plural';
import { useCurrency } from '../hooks/useCurrency';
import { formatMoney } from '../lib/money';
import { Icon } from '../components';

// Group detail — members, the group's Cookie Jar, and its open bets.
export function GroupScreen({ navigation, route }: any) {
  const currency = useCurrency();
  const groupId: string | undefined = route?.params?.id;

  const { data: group } = useQuery<any>(
    async () => (groupId ? await getGroup(groupId) : null),
    null,
    [groupId],
  );
  const name = group?.name ?? route?.params?.name ?? 'Group';

  const members = (group?.members ?? []).map((m: any) => ({
    initials: (m.profile?.display_name ?? m.profile?.handle ?? '??').slice(0, 2).toUpperCase(),
  }));

  const { data: bets } = useQuery<BetCardData[]>(
    async () => {
      if (!groupId) return [];
      const uid = await uidOrNull();
      return (await getFeed(groupId)).map((b) => toBetCard(b, uid));
    },
    [],
    [groupId],
  );

  const { data: jar } = useQuery(
    async () => (groupId ? await getJar(groupId) : { violations: [], totalCents: 0 }),
    { violations: [] as any[], totalCents: 0 },
    [groupId],
  );

  const openBets = bets.filter((b) => b.status === 'active' || b.status === 'live').length;
  const settled = bets.filter(
    (b) => b.status === 'win' || b.status === 'loss' || b.status === 'settled',
  ).length;

  return (
    <ScreenBackground tone="base">
      <NavHeader
        variant="back"
        title={name}
        onBack={() => navigation.goBack()}
        rightActions={[
          {
            icon: <Icon name="plus" size={20} color={colors.text.secondary} strokeWidth={2} />,
            onPress: () =>
              navigation.navigate('ShareInvite', { name, groupId, code: group?.invite_code }),
            accessibilityLabel: 'Invite',
          },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>{group?.emoji ?? '👥'}</Text>
          <AvatarStack people={members} max={5} size="md" />
          <Text style={styles.count}>
            {plural(members.length, 'member')}
          </Text>
        </View>

        {/* Group tiles */}
        <View style={styles.row}>
          {/* hero, not wide: hero's height is defined as two stat tiles plus the
              gap, so it lines up with the column beside it. wide (150) left the
              column overhanging by ~76pt. */}
          <BentoTile
            size="hero" tone="amber" icon="jar"
            value={formatMoney(jar.totalCents, currency)}
            label={`${jar.violations.length} ${jar.violations.length === 1 ? 'violation' : 'violations'}`}
            caption="Open the jar →"
            onPress={() =>
              navigation.navigate('CookieJar', {
                groupId: route?.params?.id,
                groupName: name,
              })
            }
          />
          <View style={styles.col}>
            <BentoTile size="stat" tone="navy" value={`${openBets}`} label="Open bets" />
            <BentoTile size="stat" tone="mint-tint" value={`${settled}`} label="Settled" />
          </View>
        </View>

        <Text style={styles.q}>OPEN BETS</Text>
        {bets.length === 0 ? (
          <Text style={styles.empty}>Nothing open in here yet. Be the first.</Text>
        ) : (
          bets.map((b) => (
            <BetCard key={b.id} bet={b} onPress={() => navigation.navigate('BetDetail', { id: b.id })} />
          ))
        )}

        <Button
          label="Start a new bet"
          onPress={() => navigation.navigate('CreateBet', { groupId })}
          fullWidth
          style={styles.cta}
        />
        <Button
          label="Start a party pool"
          onPress={() => navigation.navigate('CreatePool', { groupId })}
          variant="secondary"
          fullWidth
        />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[3], paddingBottom: spacing[8] },
  icon: { fontSize: 24, color: colors.text.secondary },
  header: { alignItems: 'center', gap: spacing[2], paddingVertical: spacing[2] },
  emoji: { fontSize: 44 },
  count: { fontFamily: 'Inter-Regular', fontSize: 12, color: colors.text.tertiary },
  row: { flexDirection: 'row', gap: spacing[3] },
  col: { gap: spacing[3] },
  q: { fontFamily: 'Barlow-SemiBold', fontSize: 11, letterSpacing: 2, color: colors.semantic.awaiting, marginTop: spacing[3] },
  empty: { fontFamily: 'Inter-Regular', fontSize: 14, color: colors.text.tertiary },
  cta: { marginTop: spacing[3] },
});
