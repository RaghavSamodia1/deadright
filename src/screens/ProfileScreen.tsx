import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  CredRing,
  StatsRow,
  FilterChip,
  BetCard,
  SkeletonBetCard,
  type BetCardData,
  type Stat,
} from '../components';
import { getMyProfile, getStats } from '../api/profile';
import { getFeed } from '../api/bets';
import { useQuery } from '../hooks/useQuery';
import { uidOrNull } from '../lib/supabase';
import { toBetCard } from '../lib/mappers';
import { useCurrency } from '../hooks/useCurrency';
import { formatMoney } from '../lib/money';
import { Icon } from '../components';

type Tab = 'all' | 'wins' | 'losses';

// V2-05 Profile (design-v2.md §5) — cred ring hero + stats + filtered history.
export function ProfileScreen({ navigation }: any) {
  const [tab, setTab] = useState<Tab>('all');
  const currency = useCurrency();

  const { data: profile } = useQuery(getMyProfile, {
    handle: 'You',
    display_name: 'You',
    cred_score: 500,
    current_streak: 0,
  } as any);

  const { data: myStats } = useQuery(
    async () => {
      const uid = await uidOrNull();
      return uid ? await getStats(uid) : { total: 0, wins: 0, losses: 0, winRate: 0 };
    },
    { total: 0, wins: 0, losses: 0, winRate: 0 },
  );

  const cred = profile.cred_score ?? 500;
  // Cred runs on a 500-point spread around a 500 baseline (recompute_cred).
  const percentile = Math.max(0, Math.min(100, Math.round(((cred - 250) / 500) * 100)));

  const stats: Stat[] = [
    // getStats counts resolved bets only, so "Called" read 0 while an open
    // bet of theirs sat right below it. Label what it actually measures.
    { value: `${myStats.total}`, label: 'Settled' },
    { value: `${myStats.winRate}%`, label: 'Win rate' },
    { value: `${cred}`, label: 'Cred', highlight: true },
  ];

  // Two invented bets used to stand here as the initial value — "England reach
  // the Euros final", won, eleven people, attributed to you — so your own
  // profile opened on somebody else's history until the real feed arrived.
  // Fabricated content dressed as a loading state is the worst of both: it is
  // not true, and it is not honest about waiting. SkeletonBetCard has existed
  // since the component library was written and had never once been used.
  const { data: history, loading: historyLoading } = useQuery<BetCardData[]>(
    async () => {
      const uid = await uidOrNull();
      return (await getFeed()).map((b) => toBetCard(b, uid, currency));
    },
    [],
  );

  const filtered =
    tab === 'all' ? history : history.filter((b) => (tab === 'wins' ? b.status === 'win' : b.status === 'loss'));

  return (
    <ScreenBackground tone="base">
      <NavHeader
        variant="back"
        title="Profile"
        onBack={() => navigation.goBack()}
        rightActions={[
          {
            icon: <Icon name="gear" size={20} color={colors.text.secondary} strokeWidth={1.9} />,
            onPress: () => navigation.navigate('Settings'),
            accessibilityLabel: 'Settings',
          },
        ]}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cred hero */}
        <View style={styles.hero}>
          <CredRing percent={percentile} score={cred} size={148} strokeWidth={10} />
          <Text style={styles.handle}>{profile.handle}</Text>
          <Text style={styles.sub}>
            {myStats.total > 0
              ? `${myStats.wins}W · ${myStats.losses}L · Your word is your bond`
              : 'Your word is your bond'}
          </Text>
        </View>

        <StatsRow stats={stats} />

        {/* History tabs */}
        <View style={styles.tabs}>
          <FilterChip label="All" active={tab === 'all'} onPress={() => setTab('all')} />
          <FilterChip label="Wins" active={tab === 'wins'} onPress={() => setTab('wins')} />
          <FilterChip label="Losses" active={tab === 'losses'} onPress={() => setTab('losses')} />
        </View>

        {historyLoading && history.length === 0 ? (
          <>
            <SkeletonBetCard />
            <SkeletonBetCard />
          </>
        ) : filtered.length === 0 ? (
          <Text style={styles.emptyHistory}>
            {tab === 'all'
              ? 'Nothing settled yet.'
              : tab === 'wins'
                ? 'No wins on the board yet.'
                : 'No losses. Yet.'}
          </Text>
        ) : (
          filtered.map((b) => (
            <BetCard key={b.id} bet={b} onPress={() => navigation.navigate('BetDetail', { id: b.id })} />
          ))
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.screenGutter,
    gap: spacing[4],
    paddingBottom: spacing[8],
  },
  hero: { alignItems: 'center', gap: spacing[2], paddingVertical: spacing[3] },
  emptyHistory: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text.tertiary,
    paddingVertical: spacing[5],
    textAlign: 'center',
  },
  handle: {
    fontFamily: 'Barlow-Bold',
    fontSize: 20,
    color: colors.text.primary,
  },
  sub: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.text.tertiary,
  },
  icon: { fontSize: 18, color: colors.text.secondary },
  tabs: { flexDirection: 'row', gap: spacing[2] },
});
