import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { spacing } from '../tokens';
import { ScreenBackground, NavHeader, ListRow, Avatar, Button, EmptyState } from '../components';
import { getBlockedUsers, unblockUser } from '../api/settings';
import { useQuery, useAction } from '../hooks/useQuery';

export function BlockedUsersScreen({ navigation }: any) {
  const { data: blocked, refetch } = useQuery(getBlockedUsers, [] as any[]);
  const { run: unblock, loading } = useAction(unblockUser);

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="back" title="Blocked users" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {blocked.length === 0 ? (
          <EmptyState
            icon="ban"
            title="No one’s blocked"
            body="People you block can’t bet you, add you to groups, or see your profile."
          />
        ) : (
          blocked.map((b: any) => {
            const name = b.blocked?.display_name ?? b.blocked?.handle ?? '??';
            return (
              <ListRow
                key={b.blocked_id}
                title={b.blocked?.handle ? b.blocked.handle : 'Blocked user'}
                subtitle={b.blocked?.display_name ?? undefined}
                left={<Avatar size="sm" initials={name.slice(0, 2).toUpperCase()} tint="neutral" />}
                right={
                  <Button
                    label="Unblock"
                    size="sm"
                    variant="secondary"
                    loading={loading}
                    onPress={async () => {
                      await unblock(b.blocked_id);
                      refetch();
                    }}
                  />
                }
              />
            );
          })
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[3], paddingBottom: spacing[8] },
});
