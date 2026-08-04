import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, ListRow, EmptyState, Button } from '../components';
import { getMyPools } from '../api/pools';
import { useQuery } from '../hooks/useQuery';
import { plural } from '../lib/plural';
import { relativeTime } from '../lib/plural';

/**
 * Your party pools.
 *
 * getMyPools() existed from the start but nothing ever called it: the only
 * route to a pool was the replace() immediately after creating one, so leaving
 * that screen stranded it — the share link kept working while the host lost the
 * results. This is the way back in.
 */
export function PoolsScreen({ navigation }: any) {
  const { data: pools, loading, error } = useQuery(getMyPools, [] as any[]);

  const statusLabel = (p: any) =>
    p.status === 'open' ? 'Open' : p.status === 'locked' ? 'Locked' : 'Settled';

  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title="Party Pools" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Couldn’t load your pools</Text>
            <Text style={styles.noticeBody}>{error.message}</Text>
          </View>
        ) : pools.length === 0 ? (
          <EmptyState
            emoji="🎉"
            title={loading ? 'Loading…' : 'No pools yet'}
            body="A pool is one link you send round a room. Everyone picks from their phone — no app, no signup."
          />
        ) : (
          pools.map((p: any) => (
            <ListRow
              key={p.id}
              title={p.question}
              subtitle={`${p.title ?? 'Pool'} · ${plural(p.entries?.length ?? 0, 'entry', 'entries')} · ${relativeTime(p.created_at)}`}
              value={statusLabel(p)}
              valueColor={
                p.status === 'open' ? colors.semantic.awaiting : colors.semantic.win
              }
              showChevron
              onPress={() => navigation.navigate('PoolDetail', { id: p.id })}
            />
          ))
        )}

        <Button
          label="Start a pool 🎉"
          onPress={() => navigation.navigate('CreatePool')}
          fullWidth
          style={styles.cta}
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
    padding: spacing[4],
    gap: spacing[2],
  },
  noticeTitle: { fontFamily: 'Barlow-Bold', fontSize: 15, color: colors.text.primary },
  noticeBody: { fontFamily: 'Inter-Regular', fontSize: 13, color: colors.text.secondary },
});
