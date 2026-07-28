import React, { useState } from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, ListRow, Avatar, Button, EmptyState } from '../components';

type Blocked = { id: string; handle: string; initials: string };

export function BlockedUsersScreen({ navigation }: any) {
  const [blocked, setBlocked] = useState<Blocked[]>([
    { id: '1', handle: '@troll_ted', initials: 'TT' },
  ]);

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="back" title="Blocked users" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {blocked.length === 0 ? (
          <EmptyState emoji="🚫" title="No one’s blocked" body="People you block can’t bet you or see your profile." />
        ) : (
          blocked.map((b) => (
            <ListRow
              key={b.id}
              title={b.handle}
              left={<Avatar size="sm" initials={b.initials} tint="neutral" />}
              right={
                <Button
                  label="Unblock"
                  size="sm"
                  variant="secondary"
                  onPress={() => setBlocked((prev) => prev.filter((x) => x.id !== b.id))}
                />
              }
            />
          ))
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[3], paddingBottom: spacing[8] },
});
