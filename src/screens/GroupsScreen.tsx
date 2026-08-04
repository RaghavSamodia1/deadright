import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, ListRow, EmptyState, Button } from '../components';
import { getMyGroups } from '../api/groups';
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

  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title="Groups" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Couldn’t load your groups</Text>
            <Text style={styles.noticeBody}>{error.message}</Text>
          </View>
        ) : groups.length === 0 ? (
          <EmptyState
            emoji="👥"
            title={loading ? 'Loading…' : 'No groups yet'}
            body="Everything lives inside a group — bets, the Cookie Jar, the ledger. Make one, or join with a friend's code."
          />
        ) : (
          groups.map((g: any) => (
            <ListRow
              key={g.id}
              title={`${g.emoji ?? '👥'}  ${g.name}`}
              subtitle={plural(g.members?.length ?? 0, 'member')}
              showChevron
              onPress={() => navigation.navigate('Group', { id: g.id, name: g.name })}
            />
          ))
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
  cta: { marginTop: spacing[3] },
  notice: {
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[4],
    gap: spacing[2],
  },
  noticeTitle: { fontFamily: 'Barlow-Bold', fontSize: 15, color: colors.text.primary },
  noticeBody: { fontFamily: 'Inter-Regular', fontSize: 13, color: colors.text.secondary },
});
