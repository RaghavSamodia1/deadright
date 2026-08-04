import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  FilterChip,
  BetCard,
  EmptyState,
  type BetCardData,
} from '../components';
import type { BetStatus } from '../components';
import { getFeed } from '../api/bets';
import { useQuery } from '../hooks/useQuery';
import { uidOrNull } from '../lib/supabase';
import { toBetCard } from '../lib/mappers';

// V2-08 Full feed (design-v2.md §5) — the v1 feed, now a pushed screen from Home.
type Filter = 'all' | 'awaiting' | 'live' | 'win' | 'disputed';

export function FeedScreen({ navigation }: any) {
  const [filter, setFilter] = useState<Filter>('all');

  const MOCK: BetCardData[] = [
    {
      id: '1', title: 'Arsenal win the league this season', status: 'awaiting',
      author: { handle: '@marcus', initials: 'MC' }, group: 'Sunday League',
      sideAPercent: 62, sideACount: 5, sideBCount: 3, participantCount: 8,
      stake: '£10', deadline: new Date(Date.now() + 1000 * 60 * 60 * 26),
    },
    {
      id: '2', title: 'Priya finishes the marathon under 4h', status: 'live',
      author: { handle: '@priya', initials: 'PR' }, group: 'Flatmates',
      sideAPercent: 48, sideACount: 4, sideBCount: 4, participantCount: 8,
      deadline: new Date(Date.now() + 1000 * 60 * 90),
    },
    {
      id: '3', title: 'It snows in London before December', status: 'disputed',
      author: { handle: '@deej', initials: 'DJ' }, group: 'Sunday League',
      sideAPercent: 30, sideACount: 3, sideBCount: 7, participantCount: 10,
      deadline: new Date(Date.now() - 1000 * 60 * 60 * 5),
    },
    {
      id: '4', title: 'England win the toss on Saturday', status: 'win',
      author: { handle: '@abi', initials: 'AB' }, group: 'Flatmates',
      sideAPercent: 51, sideACount: 6, sideBCount: 5, participantCount: 11,
      stake: '☕', deadline: new Date(Date.now() - 1000 * 60 * 60 * 30),
    },
  ];

  const { data: bets, loading, refetch } = useQuery<BetCardData[]>(
    async () => {
      const uid = await uidOrNull();
      return (await getFeed()).map((b) => toBetCard(b, uid));
    },
    MOCK,
  );

  const shown = filter === 'all' ? bets : bets.filter((b) => b.status === (filter as BetStatus));

  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title="All Bets" onBack={() => navigation.goBack()} />

      <View style={styles.filters}>
        {(['all', 'awaiting', 'live', 'win', 'disputed'] as Filter[]).map((f) => (
          <FilterChip
            key={f}
            label={f === 'all' ? 'All' : f[0].toUpperCase() + f.slice(1)}
            active={filter === f}
            onPress={() => setFilter(f)}
          />
        ))}
      </View>

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
        {shown.length === 0 ? (
          <EmptyState icon="target" title="No bets here" body="Nothing matches this filter yet." />
        ) : (
          shown.map((bet) => (
            <BetCard key={bet.id} bet={bet} onPress={(b) => navigation.navigate('BetDetail', { id: b.id })} />
          ))
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    paddingHorizontal: spacing.screenGutter,
    paddingTop: spacing[2],
  },
  content: {
    padding: spacing.screenGutter,
    gap: spacing[3],
    paddingBottom: spacing[8],
  },
});
