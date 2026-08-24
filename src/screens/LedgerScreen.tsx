import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, BentoTile, ListRow, SkeletonBlock } from '../components';
import {
  getLedger,
  getLedgerSummary,
  getBalances,
  countProposalsForMe,
  type Balance,
} from '../api/ledger';
import { getMyGroups } from '../api/groups';
import { getJar } from '../api/jar';
import { useQuery } from '../hooks/useQuery';
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
  /** A claim the other side has not agreed to is not money yet. */
  status: 'proposed' | 'pending' | 'settled';
};

export function LedgerScreen({ navigation }: any) {
  const currency = useCurrency();
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
  // No invented rows here. This used to fall back to four made-up
  // transactions — "Won vs Marcus · Sunday League · +£20" — which showed on
  // every cold open and stayed put if the query failed, so a network error
  // looked like somebody else's betting history. An empty list and a skeleton
  // are both true; a fabricated one is not.
  const { data: txns, loading: txnsLoading } = useQuery<Txn[]>(
    async () => {
      const uid = await uidOrNull();
      return (await getLedger()).map((e: any) => toTxn(e, uid));
    },
    [],
  );

  const { data: awaitingMe } = useQuery(countProposalsForMe, 0);

  // Bucket the real entries into the last 7 weeks so the chart reflects
  // actual activity rather than a decorative pattern.
  const weekly = React.useMemo(() => {
    const WEEK = 604_800_000;
    const buckets = Array.from({ length: 7 }, () => 0);
    for (const t of txns) {
      // A proposal is not money. Counting it turned a week that was £5 down
      // into a green bar, disagreeing with the hero directly above it.
      if (t.status === 'proposed') continue;
      // Clamped at zero. created_at comes from the database's clock, which can
      // sit a moment ahead of the device's; a negative age floored to -1, put
      // the entry in bucket 7 and dropped it from the chart altogether. A
      // just-created entry belongs to this week.
      const age = Math.max(0, Date.now() - (t.at ?? 0));
      const idx = 6 - Math.floor(age / WEEK);
      if (idx >= 0 && idx < 7) buckets[idx] += t.amountCents;
    }
    const peak = Math.max(...buckets.map((b) => Math.abs(b)), 1);
    return buckets.map((net) => ({ net, pct: 12 + (Math.abs(net) / peak) * 88 }));
  }, [txns]);

  // Only people something is still owed to or by. Everyone else — including
  // anyone already squared up with — is on the Balances screen.
  const { data: balances } = useQuery<Balance[]>(getBalances, []);

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
            tone={netCents >= 0 ? 'mint' : 'coral'}
            icon="coin"
            value={money(netCents, netCurrency)}
            label={netMixed ? `Net · ${netCurrency}` : 'Net this season'}
            caption="All bookkeeping — no real money"
          />
          <View style={styles.col}>
            <BentoTile
              size="stat" tone="amber-tint"
              value={formatMoney(pendingCents, pendingCurrency)}
              label={pendingMixed ? `Pending · ${pendingCurrency} →` : 'Pending →'}
              onPress={() => navigation.navigate('Balances')}
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
                    // Sign first, emphasis second. The newest bar used to be
                    // win-green whatever it was, so a week you finished down
                    // was drawn in the colour of a week you finished up.
                    backgroundColor:
                      w.net < 0
                        ? colors.semantic.disputed
                        : i === weekly.length - 1
                          ? colors.semantic.win
                          : colors.border.strong,
                  },
                ]}
              />
            ))}
          </View>
        </BentoTile>

        {awaitingMe > 0 && (
          <ListRow
            title={`${plural(awaitingMe, 'entry', 'entries')} waiting on you`}
            subtitle="Somebody recorded something. Nothing counts until you agree."
            showChevron
            elevated
            onPress={() => navigation.navigate('Balances')}
          />
        )}

        {/* Who is up, who is down. Tapping a name opens what it is made of —
            the balance alone cannot say why it is what it is. */}
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
              value={money(b.netCents, b.currency)}
              valueColor={theyOwe ? colors.semantic.win : colors.semantic.disputed}
              onPress={() =>
                navigation.navigate('PersonLedger', {
                  userId: b.userId,
                  handle: b.handle,
                  displayName: b.displayName,
                })
              }
            />
          );
        })}
        {/* Specifically person-to-person. The jar can still be owed — it has
            no counterparty — so this cannot claim everything is settled. */}
        {balances.length === 0 && (
          <Text style={styles.mixedNote}>No open balances with anyone.</Text>
        )}
        <ListRow
          title="All balances"
          subtitle="Everyone, including who you've squared up with"
          showChevron
          onPress={() => navigation.navigate('Balances')}
        />
        <ListRow
          title="Record something"
          subtitle="A round, a taxi, a tenner — anything that wasn't a bet"
          showChevron
          onPress={() => navigation.navigate('RecordEntry')}
        />

        {/* Transactions */}
        <Text style={styles.section}>RECENT</Text>
        {txnsLoading && txns.length === 0 && (
          <>
            <SkeletonBlock width="100%" height={64} />
            <SkeletonBlock width="100%" height={64} />
            <SkeletonBlock width="100%" height={64} />
          </>
        )}
        {!txnsLoading && txns.length === 0 && (
          <Text style={styles.mixedNote}>
            Nothing on the books yet. Settled money bets and anything you record land here.
          </Text>
        )}
        {txns.map((t) => (
          <ListRow
            key={t.id}
            title={t.title}
            subtitle={
              t.status === 'proposed'
                ? `${t.group} · waiting to be agreed`
                : `${t.group} · ${t.when}`
            }
            value={money(t.amountCents, t.currency)}
            valueColor={
              t.status === 'proposed'
                ? colors.text.tertiary
                : t.amountCents >= 0
                  ? colors.semantic.win
                  : colors.semantic.loss
            }
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
  // A hand-recorded entry is named by its note; everything else takes its name
  // from the bet, as before. Keyed off the note rather than the absence of a
  // joined bet, which getLedger cannot see — it selects bets(title) with no id,
  // so every entry looked hand-recorded and the derby loss rendered as
  // "Recorded".
  return {
    id: e.id,
    title: e.violation_id
      ? 'Cookie Jar'
      : (e.note ?? `${incoming ? 'Won vs' : 'Lost vs'} ${otherHandle}`),
    group: e.note
      ? `with ${otherHandle}`
      : (e.bet?.title ?? (e.status === 'pending' ? 'Pending' : 'Settled')),
    amountCents: incoming ? e.amount_cents : -e.amount_cents,
    currency: (e.currency ?? 'GBP').toUpperCase(),
    status: e.status,
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
