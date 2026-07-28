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

type Tab = 'all' | 'wins' | 'losses';

// V2-05 Profile (design-v2.md §5) — cred ring hero + stats + filtered history.
export function ProfileScreen({ navigation }: any) {
  const [tab, setTab] = useState<Tab>('all');

  // TODO: wire to src/api — getMyProfile(), getBetHistory(tab)
  const cred = 847;
  const percentile = 82;

  const stats: Stat[] = [
    { value: '128', label: 'Called' },
    { value: '71%', label: 'Win rate' },
    { value: `${cred}`, label: 'Cred', highlight: true },
  ];

  const history: BetCardData[] = [
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
          <Text style={styles.handle}>@raghav</Text>
          <Text style={styles.sub}>Top {100 - percentile}% · Your word is your bond</Text>
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
