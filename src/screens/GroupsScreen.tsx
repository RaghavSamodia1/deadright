import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, ListRow, EmptyState, Button } from '../components';
import { getMyGroups } from '../api/groups';
import { getMyProfile } from '../api/profile';
import { useQuery } from '../hooks/useQuery';
import { plural } from '../lib/plural';

/**
 * Every group you're in.
 *
 * Home used to carry an inline list *and* a tile that only ever created a new
 * group, so the list was the sole way back into one and the tile was a dead end
 * for anyone who already had groups. Groups get their own screen now, and the
 * create/join actions live inside it where you'd look for them.
 */
export function GroupsScreen({ navigation }: any) {
  const { data: groups, loading, error } = useQuery(getMyGroups, [] as any[]);
  const { data: me } = useQuery(getMyProfile, null as any);

  // There is no friends table — a friend is someone you share a group with, so
  // the roster is derived from group membership and de-duplicated across them.
  const people = React.useMemo(() => {
    const byId = new Map<string, { id: string; handle: string; name: string }>();
    (groups as any[]).forEach((g) =>
      (g.members ?? []).forEach((m: any) => {
        if (!m.user_id || m.user_id === me?.id || byId.has(m.user_id)) return;
        byId.set(m.user_id, {
          id: m.user_id,
          handle: m.profile?.handle ?? '',
          name: m.profile?.display_name ?? m.profile?.handle ?? 'Someone',
        });
      }),
    );
    return [...byId.values()];
  }, [groups, me?.id]);

  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title="Groups & people" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Couldn’t load your groups</Text>
            <Text style={styles.noticeBody}>{error.message}</Text>
          </View>
        ) : groups.length === 0 ? (
          <EmptyState
            icon="users"
            title={loading ? 'Loading…' : 'No groups yet'}
            body="Everything lives inside a group — bets, the Cookie Jar, the ledger. Make one, or join with a friend's code."
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
        )}

        {people.length > 0 && (
          <>
            <Text style={styles.section}>PEOPLE</Text>
            {people.map((p) => (
              <ListRow
                key={p.id}
                title={p.name}
                subtitle={p.handle ? p.handle : ''}
                showChevron
                onPress={() => navigation.navigate('FriendProfile', { handle: p.handle, id: p.id })}
              />
            ))}
          </>
        )}

        <Button
          label="New group"
          onPress={() => navigation.navigate('CreateGroup')}
          fullWidth
          style={styles.cta}
        />
        <Button
          label="Join with a code"
          onPress={() => navigation.navigate('JoinGroup')}
          variant="secondary"
          fullWidth
        />
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
  cta: { marginTop: spacing[3] },
  notice: {
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.md,
    padding: spacing[4],
    gap: spacing[2],
  },
  noticeTitle: { fontFamily: 'Barlow-Bold', fontSize: 15, color: colors.text.primary },
  noticeBody: { fontFamily: 'Inter-Regular', fontSize: 13, color: colors.text.secondary },
});
