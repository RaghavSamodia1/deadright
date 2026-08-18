import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, BentoTile, ListRow } from '../components';
import { getLedger, getLedgerSummary, getBalances, settleUpWith, type Balance } from '../api/ledger';
import { getMyGroups } from '../api/groups';
import { getJar } from '../api/jar';
import { useQuery, useAction } from '../hooks/useQuery';
import { humanError } from '../lib/errors';
import { plural } from '../lib/plural';
import { useCurrency } from '../hooks/useCurrency';
import { formatMoney, formatTotals, totalsByCurrency } from '../lib/money';
import { uidOrNull } from '../lib/supabase';

// V2-03 Ledger (design-v2.md §5) — balance hero + stat column + month chart + txns.
// No real money: every figure is bookkeeping only (see backend.md ledger_entries).
type Txn = {
  id: string;
  title: string;
  group: string;
  /**
   * Signed CENTS; + you're owed, − you owe. Was in whole units while the row
   * rendered it through a cents formatter, so a ₹20 win displayed as ₹0.2.
   */
  amountCents: number;
  /** The entry's own unit — entries can span groups, and groups set currency. */
  currency: string;
  when: string;
  /** epoch ms, for the weekly chart */
  at?: number;
};

export function LedgerScreen({ navigation }: any) {
  const currency = useCurrency();
  const MOCK_TXNS: Txn[] = [
    { id: '1', title: 'Won vs Marcus', group: 'Sunday League', amountCents: 2000, currency, when: '2h ago' },
    { id: '2', title: 'Lost vs Priya', group: 'Flatmates', amountCents: -1000, currency, when: 'Yesterday' },
    { id: '3', title: 'Cookie Jar — swearing', group: 'Flatmates', amountCents: -100, currency, when: '2d ago' },
    { id: '4', title: 'Won vs Deej', group: 'Sunday League', amountCents: 1500, currency, when: '3d ago' },
  ];

  const { data: summary } = useQuery(
    getLedgerSummary,
    {
      lifetimeCents: 0,
      thisMonthCents: 0,
      pendingCents: 0,
      lifetimeByCurrency: [],
      thisMonthByCurrency: [],
      pendingByCurrency: [],
    },
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
      if (idx >= 0 && idx < 7) buckets[idx] += t.amountCents;
    }
    const peak = Math.max(...buckets.map((b) => Math.abs(b)), 1);
    return buckets.map((net) => ({ net, pct: 12 + (Math.abs(net) / peak) * 88 }));
  }, [txns]);

  // The jar tile mirrors your first group's pot — the jar is group-scoped, so
  // there's no such thing as a personal total.
  const { data: balances, refetch: refetchBalances } = useQuery<Balance[]>(getBalances, []);
  const { run: doSettle, error: settleError } = useAction(settleUpWith);

  const confirmSettle = (b: Balance) => {
    const theyOwe = b.netCents > 0;
    Alert.alert(
      `Square up with ${b.displayName}?`,
      `${theyOwe ? 'They owe you' : 'You owe them'} ${money(Math.abs(b.netCents), b.currency)} across ${plural(b.entries, 'open item')}. This marks those ${b.currency} items settled — it doesn't move any money.`,
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Mark settled',
          onPress: async () => {
            const ok = await doSettle(b.userId, b.currency);
            if (ok === null) {
              Alert.alert('Couldn’t settle up', humanError(settleError));
              return;
            }
            refetchBalances();
          },
        },
      ],
    );
  };

  // The jar is group-scoped, so it is read in that group's currency — carry it
  // out of the query rather than formatting with the viewer's default.
  const { data: jar } = useQuery(
    async () => {
      const groups = await getMyGroups();
      if (!groups.length) return { totalCents: 0, currency: null as string | null };
      const { totalCents } = await getJar(groups[0].id);
      return { totalCents, currency: (groups[0] as any).currency ?? null };
    },
    { totalCents: 0, currency: null as string | null },
  );

  // The hero counted settled entries only, so it read +0.00 while the balances
  // below said someone owed you a thousand. Settled is history; what you are up
  // or down right now includes what is still open.
  // Signed, and in the unit the amount is actually denominated in.
  const money = (cents: number, code?: string | null) =>
    `${cents >= 0 ? '+' : '\u2212'}${formatMoney(Math.abs(cents), code ?? currency)}`;

  // Net used to be `lifetimeCents + openCents`, both of which added every
  // currency together. Settled history and still-open balances are combined per
  // unit instead, and the hero shows the biggest of them.
  const netTotals = totalsByCurrency([
    ...summary.lifetimeByCurrency,
    ...balances.map((b) => ({ currency: b.currency, cents: b.netCents })),
  ]).sort((a, b) => Math.abs(b.cents) - Math.abs(a.cents));
  const netMixed = netTotals.length > 1;
  const netCents = netTotals[0]?.cents ?? 0;
  const netCurrency = netTotals[0]?.currency ?? currency;

  const pendingTotals = summary.pendingByCurrency;
  const pendingMixed = pendingTotals.length > 1;
  const pendingCents = pendingTotals[0]?.cents ?? 0;
  const pendingCurrency = pendingTotals[0]?.currency ?? currency;

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
            value={money(netCents, netCurrency)}
            label={netMixed ? `Net · ${netCurrency}` : 'Net this season'}
            caption="All bookkeeping — no real money"
          />
          <View style={styles.col}>
            <BentoTile
              size="stat" tone="amber-tint"
              value={formatMoney(pendingCents, pendingCurrency)}
              label={pendingMixed ? `Pending · ${pendingCurrency}` : 'Pending'}
            />
            <BentoTile
              size="stat"
              tone="amber"
              value={formatMoney(jar.totalCents, jar.currency ?? currency)}
              label="Cookie Jar →"
              onPress={() => navigation.navigate('CookieJar')}
            />
          </View>
        </View>

        {/* The hero can only speak for one unit; say what the others come to
            rather than letting them vanish. */}
        {netMixed && (
          <Text style={styles.mixedNote}>
            Also open: {formatTotals(netTotals.slice(1))}
          </Text>
        )}

        {/* Row 2 — month chart */}
        <BentoTile
          size="chart"
          tone="navy"
          label={netMixed ? `Last 7 weeks · all currencies` : 'Last 7 weeks'}
        >
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

        {/* Who is up, who is down. The list below shows every transaction; this
            is the only part most people actually want to read. */}
        {balances.length > 0 && (
          <>
            <Text style={styles.section}>WHERE YOU STAND</Text>
            {balances.map((b) => {
              const theyOwe = b.netCents > 0;
              return (
                <ListRow
                  key={`${b.userId}:${b.currency}`}
                  title={b.displayName}
                  subtitle={`${theyOwe ? 'owes you' : 'you owe'} · ${plural(b.entries, 'open item')}${
                    netMixed ? ` · ${b.currency}` : ''
                  }`}
                  value={money(Math.abs(b.netCents), b.currency)}
                  valueColor={theyOwe ? colors.semantic.win : colors.semantic.disputed}
                  onPress={() => confirmSettle(b)}
                />
              );
            })}
          </>
        )}

        {/* Transactions */}
        <Text style={styles.section}>RECENT</Text>
        {txns.map((t) => (
          <ListRow
            key={t.id}
            title={t.title}
            subtitle={`${t.group} · ${t.when}`}
            value={money(t.amountCents, t.currency)}
            valueColor={t.amountCents >= 0 ? colors.semantic.win : colors.semantic.loss}
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
    amountCents: incoming ? e.amount_cents : -e.amount_cents,
    currency: (e.currency ?? 'GBP').toUpperCase(),
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
  mixedNote: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.text.tertiary,
  },
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
