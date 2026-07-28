import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  BetCard,
  StatsRow,
  TimelineEvent,
  Button,
  type BetCardData,
  type Stat,
} from '../components';

// V2-04 Bet Detail (design-v2.md §5) — BetCard + stat strip + timeline + action.
export function BetDetailScreen({ navigation, route }: any) {
  // TODO: wire to src/api — getBet(route.params.id)
  const bet: BetCardData = {
    id: route?.params?.id ?? '1',
    title: "Arsenal win the league this season",
    status: 'awaiting',
    author: { handle: '@marcus', initials: 'MC' },
    group: 'Sunday League',
    sideAPercent: 62,
    sideACount: 5,
    sideBCount: 3,
    participantCount: 8,
    stake: '£10',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 26),
    isCreator: false,
  };

  const stats: Stat[] = [
    { value: '26h', label: 'Deadline' },
    { value: bet.stake ?? '—', label: 'Stake' },
    { value: `£${(bet.participantCount * 10)}`, label: 'Pot' },
  ];

  const timeline: { text: string; timestamp: string; tone: any }[] = [
    { text: '@marcus called it — opened Side A', timestamp: '3d ago', tone: 'side-a' },
    { text: '@priya joined Side B', timestamp: '2d ago', tone: 'side-b' },
    { text: '@deej switched to Side A 👀', timestamp: '1d ago', tone: 'side-a' },
    { text: 'Resolution window opens in 26h', timestamp: 'upcoming', tone: 'awaiting' },
  ];

  return (
    <ScreenBackground tone="base">
      <NavHeader
        variant="back"
        title="Bet"
        onBack={() => navigation.goBack()}
        rightActions={[
          {
            icon: <Text style={styles.icon}>↗</Text>,
            onPress: () => navigation.navigate('ShareInvite', { id: bet.id }),
            accessibilityLabel: 'Share bet',
          },
        ]}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BetCard bet={bet} onPress={() => {}} />

        <StatsRow stats={stats} style={styles.statsRow} />

        <Text style={styles.section}>TIMELINE</Text>
        <View style={styles.timeline}>
          {timeline.map((e, i) => (
            <TimelineEvent
              key={i}
              text={e.text}
              timestamp={e.timestamp}
              tone={e.tone}
              isLast={i === timeline.length - 1}
            />
          ))}
        </View>

        <Button
          label="Pick your side"
          onPress={() => navigation.navigate('SideSelection', { id: bet.id })}
          fullWidth
          style={styles.cta}
        />
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
  icon: { fontSize: 20, color: colors.text.secondary },
  statsRow: {
    backgroundColor: colors.bg.surface1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingVertical: spacing[4],
  },
  section: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
  },
  timeline: { gap: 0 },
  cta: { marginTop: spacing[2] },
});
