import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, ListRow, TimelineEvent, Button } from '../components';

// Ledger entry detail — a settled bet's bookkeeping (no real money).
export function TransactionDetailScreen({ navigation }: any) {
  const amount = 20;
  const positive = amount >= 0;

  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title="Transaction" onBack={() => navigation.goBack()} />
      <View style={styles.root}>
        <View style={styles.hero}>
          <Text style={[styles.amount, { color: positive ? colors.semantic.win : colors.semantic.loss }]}>
            {positive ? '+' : '−'}${Math.abs(amount).toFixed(2)}
          </Text>
          <Text style={styles.sub}>You won · Sunday League</Text>
          <Text style={styles.ledgerNote}>Bookkeeping only — no money changes hands.</Text>
        </View>

        <ListRow title="Bet" subtitle='"Arsenal finish top 4"' showChevron onPress={() => navigation.navigate('BetDetail')} />
        <ListRow title="Against" subtitle="@marcus" showChevron onPress={() => navigation.navigate('FriendProfile', { handle: '@marcus' })} />
        <ListRow title="Stake" value="£20" />

        <Text style={styles.q}>HISTORY</Text>
        <View>
          <TimelineEvent text="Result agreed by both sides" timestamp="2h ago" tone="win" />
          <TimelineEvent text="@marcus proposed: you won" timestamp="3h ago" tone="side-a" />
          <TimelineEvent text="Deadline reached" timestamp="5h ago" tone="awaiting" isLast />
        </View>

        <Button label="Dispute this result" onPress={() => navigation.navigate('DisputeDetail')} variant="ghost" fullWidth style={styles.cta} />
      </View>
    </ScreenBackground>
  );
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
