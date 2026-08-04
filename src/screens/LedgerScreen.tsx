import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, BentoTile, ListRow } from '../components';
import { getLedger, getLedgerSummary } from '../api/ledger';
import { getMyGroups } from '../api/groups';
import { getJar } from '../api/jar';
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
  /** epoch ms, for the weekly chart */
  at?: number;
};

export function LedgerScreen({ navigation }: any) {
  const MOCK_TXNS: Txn[] = [
    { id: '1', title: 'Won vs Marcus', group: 'Sunday League', amount: 20, when: '2h ago' },
    { id: '2', title: 'Lost vs Priya', group: 'Flatmates', amount: -10, when: 'Yesterday' },
    { id: '3', title: 'Cookie Jar — swearing', group: 'Flatmates', amount: -1, when: '2d ago' },
    { id: '4', title: 'Won vs Deej', group: 'Sunday League', amount: 15, when: '3d ago' },
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

  // Bucket the real entries into the last 7 weeks so the chart reflects
  // actual activity rather than a decorative pattern.
  const weekly = React.useMemo(() => {
    const WEEK = 604_800_000;
    const buckets = Array.from({ length: 7 }, () => 0);
    for (const t of txns) {
      const age = Date.now() - (t.at ?? 0);
      const idx = 6 - Math.floor(age / WEEK);
      if (idx >= 0 && idx < 7) buckets[idx] += t.amount;
    }
    const peak = Math.max(...buckets.map((b) => Math.abs(b)), 1);
    return buckets.map((net) => ({ net, pct: 12 + (Math.abs(net) / peak) * 88 }));
  }, [txns]);

  // The jar tile mirrors your first group's pot — the jar is group-scoped, so
  // there's no such thing as a personal total.
  const { data: jar } = useQuery(
    async () => {
      const groups = await getMyGroups();
      if (!groups.length) return { totalCents: 0 };
      const { totalCents } = await getJar(groups[0].id);
      return { totalCents };
    },
    { totalCents: 2350 },
  );

  const netBalance = summary.lifetimeCents / 100;
  const pending = Math.round(summary.pendingCents / 100);
  const jarTotal = jar.totalCents / 100;

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
            icon="coin"
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
        <BentoTile size="chart" tone="navy" label="Last 7 weeks">
          <View style={styles.chart}>
            {weekly.map((w, i) => (
              <View
                key={i}
                style={[
                  styles.bar,
                  {
                    height: `${w.pct}%`,
                    backgroundColor:
                      i === weekly.length - 1
                        ? colors.semantic.win
                        : w.net >= 0
                          ? colors.border.strong
                          : colors.semantic.loss,
                  },
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
  const otherHandle = other?.handle ? other.handle : 'Someone';
  return {
    id: e.id,
    title: e.violation_id
      ? 'Cookie Jar'
      : `${incoming ? 'Won vs' : 'Lost vs'} ${otherHandle}`,
    group: e.bet?.title ?? (e.status === 'pending' ? 'Pending' : 'Settled'),
    amount: (incoming ? e.amount_cents : -e.amount_cents) / 100,
    when: relativeTime(e.created_at),
    at: new Date(e.created_at).getTime(),
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
