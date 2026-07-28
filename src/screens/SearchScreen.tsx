import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, SearchBar, FilterChip, ListRow, Avatar, EmptyState } from '../components';

type Filter = 'all' | 'bets' | 'people' | 'groups';

// V2-06 Search (design-v2.md §5) — search bar + type filters + results.
export function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  // TODO: wire to src/api — search(query, filter)
  const FILTER_KIND: Record<Exclude<Filter, 'all'>, 'bet' | 'person' | 'group'> = {
    bets: 'bet',
    people: 'person',
    groups: 'group',
  };
  const results =
    query.trim().length === 0
      ? []
      : [
          { kind: 'bet' as const, id: 'b1', title: `"${query}" — Arsenal top 4`, sub: 'Sunday League · awaiting' },
          { kind: 'person' as const, id: 'p1', title: '@marcus', sub: 'Cred 812 · 3 mutual groups' },
          { kind: 'group' as const, id: 'g1', title: 'Flatmates', sub: '5 members · 12 open bets' },
        ].filter((r) => filter === 'all' || r.kind === FILTER_KIND[filter]);

  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title="Search" onBack={() => navigation.goBack()} />

      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} autoFocus />
        <View style={styles.filters}>
          <FilterChip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterChip label="Bets" active={filter === 'bets'} onPress={() => setFilter('bets')} />
          <FilterChip label="People" active={filter === 'people'} onPress={() => setFilter('people')} />
          <FilterChip label="Groups" active={filter === 'groups'} onPress={() => setFilter('groups')} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {query.trim().length === 0 ? (
          <EmptyState
            emoji="🔎"
            title="Find bets, people, groups"
            body="Search anything you've called — or someone to call out."
          />
        ) : results.length === 0 ? (
          <EmptyState emoji="🤷" title="Nothing found" body={`No matches for "${query}".`} />
        ) : (
          results.map((r) => (
            <ListRow
              key={r.id}
              title={r.title}
              subtitle={r.sub}
              left={
                r.kind === 'person' ? (
                  <Avatar size="sm" initials={r.title.replace('@', '').slice(0, 2).toUpperCase()} tint="a" />
                ) : (
                  <Text style={styles.kindIcon}>{r.kind === 'bet' ? '🎯' : '👥'}</Text>
                )
              }
              showChevron
              onPress={() =>
                r.kind === 'bet'
                  ? navigation.navigate('BetDetail', { id: r.id })
                  : r.kind === 'person'
                    ? navigation.navigate('FriendProfile', { handle: r.title })
                    : navigation.navigate('Group', { id: r.id })
              }
            />
          ))
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: spacing.screenGutter,
    paddingTop: spacing[2],
    gap: spacing[3],
  },
  filters: { flexDirection: 'row', gap: spacing[2] },
  content: {
    padding: spacing.screenGutter,
    gap: spacing[3],
    paddingBottom: spacing[8],
  },
  kindIcon: { fontSize: 20 },
});
