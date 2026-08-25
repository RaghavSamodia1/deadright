import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  ListRow,
  EmptyState,
  Button,
  Avatar,
  SegmentedControl,
} from '../components';
import { getMyGroups } from '../api/groups';
import { getMyProfile } from '../api/profile';
import { useQuery } from '../hooks/useQuery';
import { plural } from '../lib/plural';
import { humanError } from '../lib/errors';

/**
 * Every group you're in.
 *
 * Home used to carry an inline list *and* a tile that only ever created a new
 * group, so the list was the sole way back into one and the tile was a dead end
 * for anyone who already had groups. Groups get their own screen now, and the
 * create/join actions live inside it where you'd look for them.
 */
/** Two letters for someone with no photo — the Avatar draws a face behind them. */
function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

type Tab = 'groups' | 'people';

export function GroupsScreen({ navigation }: any) {
  const [tab, setTab] = React.useState<Tab>('groups');
  const { data: groups, loading, error } = useQuery(getMyGroups, [] as any[]);
  const { data: me } = useQuery(getMyProfile, null as any);

  // There is no friends table — a friend is someone you share a group with, so
  // the roster is derived from group membership and de-duplicated across them.
  const people = React.useMemo(() => {
    const byId = new Map<string, { id: string; handle: string; name: string; avatar: string | null }>();
    (groups as any[]).forEach((g) =>
      (g.members ?? []).forEach((m: any) => {
        if (!m.user_id || m.user_id === me?.id || byId.has(m.user_id)) return;
        byId.set(m.user_id, {
          id: m.user_id,
          handle: m.profile?.handle ?? '',
          name: m.profile?.display_name ?? m.profile?.handle ?? 'Someone',
          avatar: m.profile?.avatar_url ?? null,
        });
      }),
    );
    return [...byId.values()];
  }, [groups, me?.id]);

  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title="Groups & people" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* The two ways in, at the top. They used to sit under both lists, so
            on an account with a few groups and a dozen people the only way to
            start one was to scroll past everything you already had. */}
        <View style={styles.actions}>
          {/* Short labels at md: "Join with a code" at lg wrapped to two lines
              in half a screen's width, and so did "New group". */}
          <Button
            label="New group"
            size="md"
            onPress={() => navigation.navigate('CreateGroup')}
            style={styles.action}
          />
          <Button
            label="Join code"
            size="md"
            variant="secondary"
            onPress={() => navigation.navigate('JoinGroup')}
            style={styles.action}
          />
        </View>

        {/* Two lists that answer different questions — "which groups am I in"
            and "who do I know" — stacked into one scroll, where the second was
            only reachable by getting past the first. */}
        <SegmentedControl
          segments={[
            { value: 'groups', label: `Groups${groups.length ? ` (${groups.length})` : ''}` },
            { value: 'people', label: `People${people.length ? ` (${people.length})` : ''}` },
          ]}
          value={tab}
          onChange={setTab}
        />

        {error ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Couldn’t load your groups</Text>
            <Text style={styles.noticeBody}>{humanError(error)}</Text>
          </View>
        ) : tab === 'groups' ? (
          groups.length === 0 ? (
            <EmptyState
              icon="users"
              title={loading ? 'Loading…' : 'No groups yet'}
              body="Everything lives inside a group: bets, the Cookie Jar, the ledger. Make one, or join with a friend's code."
            />
          ) : (
            groups.map((g: any) => (
              <ListRow
                key={g.id}
                title={`${g.emoji ?? '👥'}  ${g.name}`}
                subtitle={plural(g.members?.length ?? 0, 'Member')}
                showChevron
                onPress={() => navigation.navigate('Group', { id: g.id, name: g.name })}
              />
            ))
          )
        ) : people.length === 0 ? (
          <EmptyState
            icon="person"
            title={loading ? 'Loading…' : 'Nobody yet'}
            body="There is no friends list to fill in — people show up here once you share a group with them."
          />
        ) : (
          people.map((p) => (
            <ListRow
              key={p.id}
              left={
                <Avatar
                  size="sm"
                  uri={p.avatar ?? undefined}
                  initials={initialsOf(p.name)}
                  seed={p.handle || p.id}
                />
              }
              title={p.name}
              subtitle={p.handle ? `@${p.handle}` : ''}
              showChevron
              onPress={() => navigation.navigate('FriendProfile', { handle: p.handle, id: p.id })}
            />
          ))
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[3], paddingBottom: spacing[8] },
  section: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
    marginTop: spacing[3],
  },
  actions: { flexDirection: 'row', gap: spacing[3] },
  action: { flex: 1 },
  notice: {
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.md,
    padding: spacing[4],
    gap: spacing[2],
  },
  noticeTitle: { fontFamily: 'Barlow-Bold', fontSize: 15, color: colors.text.primary },
  noticeBody: { fontFamily: 'Inter-Regular', fontSize: 13, color: colors.text.secondary },
});
