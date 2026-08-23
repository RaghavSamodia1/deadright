import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, SearchBar, FilterChip, ListRow, Avatar, EmptyState } from '../components';
import { searchProfiles, searchBets } from '../api/profile';
import { getMyGroups } from '../api/groups';
import { useQuery } from '../hooks/useQuery';
import { plural } from '../lib/plural';
import { Icon } from '../components';

type Filter = 'all' | 'bets' | 'people' | 'groups';

// V2-06 Search (design-v2.md §5) — search bar + type filters + results.
export function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const FILTER_KIND: Record<Exclude<Filter, 'all'>, 'bet' | 'person' | 'group'> = {
    bets: 'bet',
    people: 'person',
    groups: 'group',
  };

  type Result = { kind: 'bet' | 'person' | 'group'; id: string; title: string; sub: string };

  const { data: hits, loading } = useQuery<Result[]>(
    async () => {
      const q = query.trim();
      if (q.length < 2) return [];
      const [people, bets, groups] = await Promise.all([
        searchProfiles(q),
        searchBets(q),
        getMyGroups(),
      ]);
      return [
        ...people.map((p: any) => ({
          kind: 'person' as const,
          id: p.handle,
          title: p.handle,
          sub: `${p.display_name ?? ''} · Form ${p.form_score}`,
        })),
        ...bets.map((b: any) => ({
          kind: 'bet' as const,
          id: b.id,
          title: b.title,
          sub: `${b.group_name ?? 'Personal'} · ${b.status}`,
        })),
        ...groups
          .filter((g: any) => g.name.toLowerCase().includes(q.toLowerCase()))
          .map((g: any) => ({
            kind: 'group' as const,
            id: g.id,
            title: g.name,
            sub: plural(g.members?.length ?? 0, 'Member'),
          })),
      ];
    },
    [],
    [query],
  );

  const results = hits.filter((r) => filter === 'all' || r.kind === FILTER_KIND[filter]);

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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        {query.trim().length === 0 ? (
          <EmptyState
            icon="search"
            title="Find bets, people, groups"
            body="Search anything you've called, or someone to call out."
          />
        ) : results.length === 0 ? (
          <EmptyState icon="shrug" title="Nothing found" body={`No matches for "${query}".`} />
        ) : (
          results.map((r) => (
            <ListRow
              key={r.id}
              title={r.title}
              subtitle={r.sub}
              left={
                r.kind === 'person' ? (
                  <Avatar size="sm" initials={r.title.slice(0, 2).toUpperCase()} seed={r.title} />
                ) : (
                  <Icon name={r.kind === 'bet' ? 'target' : 'users'} size={16} color={colors.text.tertiary} strokeWidth={1.9} />
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
