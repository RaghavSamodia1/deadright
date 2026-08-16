import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, ListRow, Avatar, EmptyState } from '../components';
import { getGroup } from '../api/groups';
import { useQuery } from '../hooks/useQuery';
import { uidOrNull } from '../lib/supabase';
import { humanError } from '../lib/errors';
import { plural } from '../lib/plural';

/**
 * Everyone in a group.
 *
 * GroupScreen showed an avatar stack capped at five and a count, so in any
 * group bigger than that there was no way to find out who was actually in it —
 * and no way at all to see someone's handle rather than their initials.
 */
export function GroupMembersScreen({ navigation, route }: any) {
  const groupId: string | undefined = route?.params?.id;
  const groupName: string = route?.params?.name ?? 'Group';

  const { data, loading, error } = useQuery<any>(
    async () => {
      if (!groupId) return null;
      const [group, uid] = await Promise.all([getGroup(groupId), uidOrNull()]);
      return { group, uid };
    },
    null,
    [groupId],
  );

  const members: any[] = data?.group?.members ?? [];

  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title={groupName} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? (
          <Text style={styles.error}>{humanError(error)}</Text>
        ) : members.length === 0 ? (
          <EmptyState
            icon="users"
            title={loading ? 'Loading…' : 'Nobody here yet'}
            body="Share the invite code and this fills up."
          />
        ) : (
          <>
            <Text style={styles.count}>{plural(members.length, 'member')}</Text>
            {members.map((m: any) => {
              const p = m.profile ?? {};
              const isMe = p.id && p.id === data?.uid;
              const name = p.display_name ?? p.handle ?? 'Someone';
              return (
                <ListRow
                  key={p.id ?? m.user_id}
                  left={
                    <Avatar
                      size="sm"
                      initials={(name || '??').slice(0, 2).toUpperCase()}
                      uri={p.avatar_url ?? undefined}
                      tint="a"
                    />
                  }
                  title={isMe ? `${name} (you)` : name}
                  subtitle={p.handle ?? ''}
                  value={m.role === 'admin' ? 'Admin' : undefined}
                  valueColor={colors.semantic.awaiting}
                  showChevron={!isMe}
                  onPress={
                    isMe || !p.handle
                      ? undefined
                      : () => navigation.navigate('FriendProfile', { handle: p.handle })
                  }
                />
              );
            })}
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[2], paddingBottom: spacing[8] },
  count: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.text.tertiary,
    marginBottom: spacing[1],
  },
  error: { fontFamily: 'Inter-Regular', fontSize: 14, color: colors.semantic.disputed },
});
