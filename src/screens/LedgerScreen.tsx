import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, BentoTile, ListRow } from '../components';
import { getLedger, getLedgerSummary } from '../api/ledger';
import { useQuery } from '../hooks/useQuery';
import { uidOrNull } from '../lib/supabase';

// V2-03 Ledger (design-v2.md §5) — balance hero + stat column + month chart + txns.
// No real money: every figure is bookkeeping only (see backend.md ledger_entries).
type Txn = {
  id: string;
  title: string;
  group: string;
  amount: number; // signed cents-as-dollars; + you're owed, − you owe
  when: string;
};

export function LedgerScreen({ navigation }: any) {
  const MOCK_TXNS: Txn[] = [
    { id: '1', title: 'Won vs @marcus', group: 'Sunday League', amount: 20, when: '2h ago' },
    { id: '2', title: 'Lost vs @priya', group: 'Flatmates', amount: -10, when: 'Yesterday' },
    { id: '3', title: 'Cookie Jar — swearing', group: 'Flatmates', amount: -1, when: '2d ago' },
    { id: '4', title: 'Won vs @deej', group: 'Sunday League', amount: 15, when: '3d ago' },
  ];

  const { data: summary } = useQuery(
    getLedgerSummary,
    { lifetimeCents: 14500, thisMonthCents: 4200, pendingCents: 3000 },
  );
  const { data: txns } = useQuery<Txn[]>(
    async () => {
      const uid = await uidOrNull();
      return (await getLedger()).map((e: any) => toTxn(e, uid));
    },
    MOCK_TXNS,
  );

  const netBalance = summary.lifetimeCents / 100;
  const pending = Math.round(summary.pendingCents / 100);
  const jarTotal = 23.5;

  const money = (n: number) => `${n >= 0 ? '+' : '−'}$${Math.abs(n).toFixed(2)}`;

  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title="Ledger" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Row 1 — net balance hero + pending / jar column */}
        <View style={styles.row}>
          <BentoTile
            size="hero"
            tone="mint"
            emoji="💰"
            value={money(netBalance)}
            label="Net this season"
            caption="All bookkeeping — no real money"
          />
          <View style={styles.col}>
            <BentoTile size="stat" tone="amber-tint" value={`${pending}`} label="Pending" />
            <BentoTile
              size="stat"
              tone="amber"
              value={`$${jarTotal.toFixed(0)}`}
              label="Cookie Jar →"
              onPress={() => navigation.navigate('CookieJar')}
            />
          </View>
        </View>

        {/* Row 2 — month chart */}
        <BentoTile size="chart" tone="navy" label="This month">
          <View style={styles.chart}>
            {[40, 65, 30, 80, 55, 90, 45].map((h, i) => (
              <View
                key={i}
                style={[
                  styles.bar,
                  { height: `${h}%`, backgroundColor: i === 5 ? colors.semantic.win : colors.border.strong },
                ]}
              />
            ))}
          </View>
        </BentoTile>

        {/* Transactions */}
        <Text style={styles.section}>RECENT</Text>
        {txns.map((t) => (
          <ListRow
            key={t.id}
            title={t.title}
            subtitle={`${t.group} · ${t.when}`}
            value={money(t.amount)}
            valueColor={t.amount >= 0 ? colors.semantic.win : colors.semantic.loss}
            onPress={() => navigation.navigate('TransactionDetail', { id: t.id })}
          />
        ))}
      </ScrollView>
    </ScreenBackground>
  );
}

// ledger_entries row → the Txn shape this screen renders. Amount is signed from
// *my* perspective: positive when I'm the payee.
function toTxn(e: any, uid: string | null): Txn {
  const incoming = e.to_user === uid;
  const other = incoming ? e.from : e.to;
  const otherHandle = other?.handle ? `@${other.handle}` : 'someone';
  return {
    id: e.id,
    title: e.violation_id
      ? 'Cookie Jar'
      : `${incoming ? 'Won vs' : 'Lost vs'} ${otherHandle}`,
    group: e.bet?.title ?? (e.status === 'pending' ? 'Pending' : 'Settled'),
    amount: (incoming ? e.amount_cents : -e.amount_cents) / 100,
    when: relativeTime(e.created_at),
  };
}

function relativeTime(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.screenGutter,
    gap: spacing[3],
    paddingBottom: spacing[8],
  },
  row: { flexDirection: 'row', gap: spacing[3] },
  col: { gap: spacing[3] },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 56,
    marginTop: spacing[3],
  },
  bar: {
    flex: 1,
    borderRadius: 4,
    minHeight: 4,
  },
  section: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
    marginTop: spacing[2],
  },
});
