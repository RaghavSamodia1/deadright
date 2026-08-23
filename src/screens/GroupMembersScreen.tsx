import React from 'react';
import { Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, ListRow, Avatar, EmptyState, ActionSheet } from '../components';
import { getGroup, setMemberRole } from '../api/groups';
import { useQuery, useAction } from '../hooks/useQuery';
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

  const { data, loading, error, refetch } = useQuery<any>(
    async () => {
      if (!groupId) return null;
      const [group, uid] = await Promise.all([getGroup(groupId), uidOrNull()]);
      return { group, uid };
    },
    null,
    [groupId],
  );

  const members: any[] = data?.group?.members ?? [];
  const iAmAdmin = members.some(
    (m: any) => (m.profile?.id ?? m.user_id) === data?.uid && m.role === 'admin',
  );

  const [target, setTarget] = React.useState<any | null>(null);
  const { run: doSetRole, error: roleError } = useAction(setMemberRole);

  const changeRole = async (m: any, role: 'member' | 'admin') => {
    const uid = m.profile?.id ?? m.user_id;
    const ok = await doSetRole(groupId!, uid, role);
    if (ok === null) {
      Alert.alert('Couldn’t change that', humanError(roleError));
      return;
    }
    refetch();
  };

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
                      seed={p.handle ?? name}
                    />
                  }
                  title={isMe ? `${name} (you)` : name}
                  subtitle={p.handle ?? ''}
                  value={m.role === 'admin' ? 'Admin' : undefined}
                  valueColor={colors.semantic.awaiting}
                  showChevron={!isMe}
                  // An admin gets the role controls; everyone else just gets the
                  // profile. Long-press keeps a destructive-ish action off the
                  // path of simply looking someone up.
                  onPress={
                    iAmAdmin
                      ? () => setTarget(m)
                      : isMe || !p.handle
                        ? undefined
                        : () => navigation.navigate('FriendProfile', { handle: p.handle })
                  }
                />
              );
            })}
          </>
        )}
      </ScrollView>
      <ActionSheet
        visible={!!target}
        title={target?.profile?.display_name ?? target?.profile?.handle ?? 'Member'}
        options={[
          ...(target?.profile?.handle
            ? [
                {
                  label: 'View profile',
                  onPress: () =>
                    navigation.navigate('FriendProfile', { handle: target.profile.handle }),
                },
              ]
            : []),
          target?.role === 'admin'
            ? { label: 'Remove admin', destructive: true, onPress: () => changeRole(target, 'member') }
            : { label: 'Make admin', primary: true, onPress: () => changeRole(target, 'admin') },
        ]}
        onDismiss={() => setTarget(null)}
      />
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
