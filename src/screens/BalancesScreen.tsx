import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, ListRow, Avatar, EmptyState } from '../components';
import { getCounterparties, type Counterparty } from '../api/ledger';
import { useQuery } from '../hooks/useQuery';
import { useCurrency } from '../hooks/useCurrency';
import { formatMoney, formatTotals, totalsByCurrency } from '../lib/money';
import { plural } from '../lib/plural';

/**
 * Who you owe and who owes you, one row per person.
 *
 * People you have squared up with keep a row here rather than vanishing the
 * moment their balance hits zero — settling a debt should not delete the record
 * of every bet that made it. Their history is one tap away, same as anyone's.
 */
export function BalancesScreen({ navigation }: any) {
  const currency = useCurrency();
  const { data: people, loading } = useQuery<Counterparty[]>(getCounterparties, []);

  const owing = people.filter((p) => p.netCents !== 0);
  const square = people.filter((p) => p.netCents === 0);

  const toMe = totalsByCurrency(
    owing.filter((p) => p.netCents > 0).map((p) => ({ currency: p.currency, cents: p.netCents })),
  );
  const byMe = totalsByCurrency(
    owing.filter((p) => p.netCents < 0).map((p) => ({ currency: p.currency, cents: -p.netCents })),
  );

  const openPerson = (p: Counterparty) =>
    navigation.navigate('PersonLedger', {
      userId: p.userId,
      handle: p.handle,
      displayName: p.displayName,
    });

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?';

  const row = (p: Counterparty) => {
    const theyOwe = p.netCents > 0;
    const subtitle =
      p.netCents === 0
        ? `Square · ${plural(p.totalEntries, 'item')}`
        : `${theyOwe ? 'Owes you' : 'You owe'} · ${plural(p.openEntries, 'open item')}`;
    return (
      <ListRow
        key={`${p.userId}:${p.currency}`}
        left={<Avatar size="sm" seed={p.handle} initials={initials(p.displayName)} />}
        title={p.displayName}
        subtitle={subtitle}
        value={
          p.netCents === 0
            ? '—'
            : `${theyOwe ? '+' : '−'}${formatMoney(Math.abs(p.netCents), p.currency)}`
        }
        valueColor={
          p.netCents === 0
            ? colors.text.tertiary
            : theyOwe
              ? colors.semantic.win
              : colors.semantic.disputed
        }
        onPress={() => openPerson(p)}
      />
    );
  };

  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title="Balances" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {owing.length > 0 && (
          <View style={styles.summary}>
            <View style={styles.summaryHalf}>
              <Text style={styles.summaryLabel}>YOU'RE OWED</Text>
              <Text style={[styles.summaryValue, { color: colors.semantic.win }]}>
                {formatTotals(toMe, currency)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryHalf}>
              <Text style={styles.summaryLabel}>YOU OWE</Text>
              <Text style={[styles.summaryValue, { color: colors.semantic.disputed }]}>
                {formatTotals(byMe, currency)}
              </Text>
            </View>
          </View>
        )}

        {owing.length > 0 && (
          <>
            <Text style={styles.section}>OPEN</Text>
            {owing.map(row)}
          </>
        )}

        {square.length > 0 && (
          <>
            <Text style={styles.section}>SETTLED UP</Text>
            {square.map(row)}
          </>
        )}

        {!loading && people.length === 0 && (
          <EmptyState
            icon="scales"
            title="Nobody owes anybody"
            body="Money bets you settle show up here, netted per person. Nothing has landed yet."
          />
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.screenGutter,
    gap: spacing[3],
    paddingBottom: spacing[8],
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.md,
    paddingVertical: spacing[4],
  },
  summaryHalf: { flex: 1, alignItems: 'center', gap: 4 },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border.default },
  summaryLabel: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 10,
    letterSpacing: 1.6,
    color: colors.text.tertiary,
  },
  summaryValue: {
    fontFamily: 'Barlow-Black',
    fontSize: 22,
    letterSpacing: -0.4,
  },
  section: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
    marginTop: spacing[2],
  },
});
