import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, ListRow, TimelineEvent, Button } from '../components';
import { getLedger, markSettled } from '../api/ledger';
import { useQuery, useAction } from '../hooks/useQuery';
import { uidOrNull } from '../lib/supabase';

// Ledger entry detail — a settled bet's bookkeeping (no real money).
export function TransactionDetailScreen({ navigation, route }: any) {
  const entryId: string | undefined = route?.params?.id;

  const { data: entry } = useQuery<any>(
    async () => {
      if (!entryId) return null;
      const [rows, uid] = await Promise.all([getLedger(), uidOrNull()]);
      const found = (rows as any[]).find((e) => e.id === entryId);
      return found ? { ...found, uid } : null;
    },
    null,
    [entryId],
  );

  const { run: settle, loading: settling } = useAction(markSettled);

  const incoming = entry ? entry.to_user === entry.uid : true;
  const amount = entry ? (incoming ? entry.amount_cents : -entry.amount_cents) / 100 : 20;
  const positive = amount >= 0;
  const other = entry ? (incoming ? entry.from : entry.to) : null;
  const otherHandle = other?.handle ? other.handle : '—';
  const isJar = !!entry?.violation_id;
  const isPending = entry?.status === 'pending';

  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title="Transaction" onBack={() => navigation.goBack()} />
      <View style={styles.root}>
        <View style={styles.hero}>
          <Text style={[styles.amount, { color: positive ? colors.semantic.win : colors.semantic.loss }]}>
            {positive ? '+' : '−'}${Math.abs(amount).toFixed(2)}
          </Text>
          <Text style={styles.sub}>
            {isJar ? 'Cookie Jar' : positive ? 'You won' : 'You lost'}
            {isPending ? ' · pending' : ' · settled'}
          </Text>
          <Text style={styles.ledgerNote}>Bookkeeping only — no money changes hands.</Text>
        </View>

        {entry?.bet?.title && (
          <ListRow
            title="Bet"
            subtitle={`"${entry.bet.title}"`}
            showChevron
            onPress={() => navigation.navigate('BetDetail', { id: entry.bet_id })}
          />
        )}
        {!isJar && other && (
          <ListRow
            title={incoming ? 'From' : 'To'}
            subtitle={otherHandle}
            showChevron
            onPress={() => navigation.navigate('FriendProfile', { handle: otherHandle })}
          />
        )}
        <ListRow title="Amount" value={`$${Math.abs(amount).toFixed(2)}`} />

        {isPending && entryId && (
          <Button
            label="Mark as settled"
            onPress={async () => {
              await settle(entryId);
              navigation.goBack();
            }}
            loading={settling}
            fullWidth
            style={styles.cta}
          />
        )}

        <Text style={styles.q}>HISTORY</Text>
        <View>
          {entry?.settled_at && (
            <TimelineEvent text="Marked settled" timestamp={when(entry.settled_at)} tone="win" />
          )}
          <TimelineEvent
            text={isJar ? 'Added to the Cookie Jar' : 'Bet resolved — ledger entry created'}
            timestamp={entry?.created_at ? when(entry.created_at) : '—'}
            tone={isJar ? 'awaiting' : 'side-a'}
            isLast
          />
        </View>

        {entry?.bet_id && (
          <Button
            label="Dispute this result"
            onPress={() => navigation.navigate('DisputeDetail', { betId: entry.bet_id })}
            variant="ghost"
            fullWidth
            style={styles.cta}
          />
        )}
      </View>
    </ScreenBackground>
  );
}

function when(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.round(hrs / 24)}d ago`;
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.screenGutter, gap: spacing[3] },
  hero: { alignItems: 'center', gap: 4, paddingVertical: spacing[5] },
  amount: { fontFamily: 'Barlow-Black', fontSize: 48, letterSpacing: -1 },
  sub: { fontFamily: 'Barlow-Bold', fontSize: 15, color: colors.text.primary },
  ledgerNote: { fontFamily: 'Inter-Regular', fontSize: 11, color: colors.text.tertiary, marginTop: 4 },
  q: { fontFamily: 'Barlow-SemiBold', fontSize: 11, letterSpacing: 2, color: colors.semantic.awaiting, marginTop: spacing[3] },
  cta: { marginTop: spacing[2] },
});
