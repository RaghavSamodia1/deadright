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
  type BetCardData,
  type Stat,
} from '../components';
import { getMyProfile, getStats } from '../api/profile';
import { getFeed } from '../api/bets';
import { useQuery } from '../hooks/useQuery';
import { uidOrNull } from '../lib/supabase';
import { toBetCard } from '../lib/mappers';

type Tab = 'all' | 'wins' | 'losses';

// V2-05 Profile (design-v2.md §5) — cred ring hero + stats + filtered history.
export function ProfileScreen({ navigation }: any) {
  const [tab, setTab] = useState<Tab>('all');

  const { data: profile } = useQuery(getMyProfile, {
    handle: 'you',
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
    { value: `${myStats.total}`, label: 'Called' },
    { value: `${myStats.winRate}%`, label: 'Win rate' },
    { value: `${cred}`, label: 'Cred', highlight: true },
  ];

  const MOCK_HISTORY: BetCardData[] = [
    {
      id: 'h1',
      title: "England reach the Euros final",
      status: 'win',
      author: { handle: '@you', initials: 'RS' },
      group: 'Sunday League',
      sideAPercent: 55, sideACount: 6, sideBCount: 5, participantCount: 11,
      stake: '£10', deadline: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
    {
      id: 'h2',
      title: "It rains at the BBQ on Saturday",
      status: 'loss',
      author: { handle: '@you', initials: 'RS' },
      group: 'Flatmates',
      sideAPercent: 40, sideACount: 2, sideBCount: 3, participantCount: 5,
      deadline: new Date(Date.now() - 1000 * 60 * 60 * 72),
    },
  ];

  const { data: history } = useQuery<BetCardData[]>(
    async () => {
      const uid = await uidOrNull();
      return (await getFeed()).map((b) => toBetCard(b, uid));
    },
    MOCK_HISTORY,
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
            icon: <Text style={styles.icon}>⚙</Text>,
            onPress: () => navigation.navigate('Settings'),
            accessibilityLabel: 'Settings',
          },
        ]}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cred hero */}
        <View style={styles.hero}>
          <CredRing percent={percentile} score={cred} size={148} strokeWidth={10} />
          <Text style={styles.handle}>@{profile.handle}</Text>
          <Text style={styles.sub}>
            {myStats.total > 0
              ? `${myStats.wins}W · ${myStats.losses}L · Your word is your bond`
              : 'Your word is your bond'}
          </Text>
        </View>

        <StatsRow stats={stats} style={styles.statsRow} />

        {/* History tabs */}
        <View style={styles.tabs}>
          <FilterChip label="All" active={tab === 'all'} onPress={() => setTab('all')} />
          <FilterChip label="Wins" active={tab === 'wins'} onPress={() => setTab('wins')} />
          <FilterChip label="Losses" active={tab === 'losses'} onPress={() => setTab('losses')} />
        </View>

        {filtered.map((b) => (
          <BetCard key={b.id} bet={b} onPress={() => navigation.navigate('BetDetail', { id: b.id })} />
        ))}
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
  statsRow: {
    backgroundColor: colors.bg.surface1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing[4],
  },
  tabs: { flexDirection: 'row', gap: spacing[2] },
});
