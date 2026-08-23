import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  ListRow,
  Avatar,
  Button,
  EmptyState,
  ActionSheet,
  type ActionSheetOption,
} from '../components';
import { getLedgerWith, settleUpWith, markSettled, type PersonEntry } from '../api/ledger';
import { useQuery } from '../hooks/useQuery';
import { formatMoney, totalsByCurrency } from '../lib/money';
import { plural, relativeTime } from '../lib/plural';
import { humanError } from '../lib/errors';

/**
 * Everything between you and one other person: what it comes to, what is still
 * open, and what has already been closed off.
 *
 * The ledger could say "you owe Priya £14" but never why. Answering that meant
 * reading the whole transaction list and picking out the rows with her name on
 * — the exact arithmetic the balances were added to save people from. Tapping
 * her name used to go straight to a confirm dialog that settled all fourteen
 * pounds at once, which is a strange thing to ask someone to agree to before
 * showing them what they are agreeing about.
 *
 * So: the standing at the top, the open items underneath it individually, and
 * the history below that. Settling is available per item or all at once, and
 * both say plainly that no money moves.
 */
export function PersonLedgerScreen({ navigation, route }: any) {
  const userId: string | undefined = route?.params?.userId;
  const handle: string | undefined = route?.params?.handle;
  const displayName: string = route?.params?.displayName ?? handle ?? 'Someone';

  const { data: entries, loading, refetch } = useQuery<PersonEntry[]>(
    async () => (userId ? getLedgerWith(userId) : []),
    [],
    [userId],
  );

  /** Which row is mid-settle — an entry id, or `all:GBP`. */
  const [busy, setBusy] = React.useState<string | null>(null);
  const [sheetFor, setSheetFor] = React.useState<PersonEntry | null>(null);

  /**
   * Errors are caught here rather than through useAction, whose `error` is
   * state: reading it in the same tick as the call returns gives the previous
   * render's value, so a real failure reports as a generic one.
   */
  const run = async (key: string, fn: () => Promise<unknown>, failTitle: string) => {
    setBusy(key);
    try {
      await fn();
      refetch();
    } catch (e) {
      Alert.alert(failTitle, humanError(e));
    } finally {
      setBusy(null);
    }
  };

  const open = entries.filter((e) => e.status === 'pending');
  const settled = entries.filter((e) => e.status === 'settled');

  // Per currency, because a ₹ debt and a £ debt with the same person are two
  // debts. Zero totals are kept: two open entries that cancel out are still two
  // open entries somebody has to close.
  const openCurrencies = [...new Set(open.map((e) => e.currency))];
  const netByCurrency = totalsByCurrency(
    open.map((e) => ({ currency: e.currency, cents: e.amountCents })),
  );

  const confirmSettleAll = (code: string) => {
    const items = open.filter((e) => e.currency === code);
    const cents = items.reduce((n, e) => n + e.amountCents, 0);
    const theyOwe = cents > 0;
    Alert.alert(
      `Square up with ${displayName}?`,
      cents === 0
        ? `Nothing is owed either way. This closes off ${plural(items.length, 'open item')} — it doesn't move any money.`
        : `${theyOwe ? 'They owe you' : 'You owe them'} ${formatMoney(Math.abs(cents), code)} across ${plural(
            items.length,
            'open item',
          )}. This marks those ${code} items settled — it doesn't move any money.`,
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Mark settled',
          onPress: () =>
            run(`all:${code}`, () => settleUpWith(userId!, code), 'Couldn’t settle up'),
        },
      ],
    );
  };

  const sheetOptions = (e: PersonEntry): ActionSheetOption[] => [
    {
      label: 'Mark settled',
      primary: true,
      onPress: () => run(e.id, () => markSettled(e.id), 'Couldn’t settle that item'),
    },
    {
      label: 'Open transaction',
      onPress: () => navigation.navigate('TransactionDetail', { id: e.id }),
    },
  ];

  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  const nothingYet = !loading && entries.length === 0;

  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title={displayName} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Avatar size="lg" seed={handle ?? displayName} initials={initials || '?'} />
          <Text style={styles.name}>{displayName}</Text>
          {!!handle && <Text style={styles.handle}>@{handle}</Text>}

          {open.length === 0 ? (
            <Text style={styles.square}>
              {entries.length ? 'All square' : 'Nothing on the books yet'}
            </Text>
          ) : (
            netByCurrency.map((t) => (
              <View key={t.currency} style={styles.standing}>
                <Text style={styles.standingLabel}>
                  {t.cents === 0
                    ? 'Square, with items still open'
                    : t.cents > 0
                      ? `${displayName} owes you`
                      : `You owe ${displayName}`}
                </Text>
                <Text
                  style={[
                    styles.standingAmount,
                    {
                      color:
                        t.cents === 0
                          ? colors.text.secondary
                          : t.cents > 0
                            ? colors.semantic.win
                            : colors.semantic.disputed,
                    },
                  ]}
                >
                  {formatMoney(Math.abs(t.cents), t.currency)}
                </Text>
              </View>
            ))
          )}

          <Text style={styles.note}>Bookkeeping only. No money changes hands.</Text>
        </View>

        {openCurrencies.map((code) => (
          <Button
            key={code}
            label={openCurrencies.length > 1 ? `Mark ${code} settled` : 'Mark all settled'}
            variant="primary"
            fullWidth
            loading={busy === `all:${code}`}
            onPress={() => confirmSettleAll(code)}
          />
        ))}

        {open.length > 0 && (
          <>
            <Text style={styles.section}>STILL OPEN</Text>
            {open.map((e) => {
              const owed = e.amountCents >= 0;
              return (
                <ListRow
                  key={e.id}
                  title={e.betTitle ?? 'Ledger entry'}
                  subtitle={`${owed ? 'Owes you' : 'You owe'} · ${relativeTime(e.createdAt)}`}
                  value={`${owed ? '+' : '−'}${formatMoney(Math.abs(e.amountCents), e.currency)}`}
                  valueColor={owed ? colors.semantic.win : colors.semantic.disputed}
                  onPress={() => setSheetFor(e)}
                />
              );
            })}
            <Text style={styles.hint}>Tap an item to settle it on its own.</Text>
          </>
        )}

        {settled.length > 0 && (
          <>
            <Text style={styles.section}>HISTORY</Text>
            {settled.map((e) => {
              const won = e.amountCents >= 0;
              return (
                <ListRow
                  key={e.id}
                  title={e.betTitle ?? 'Ledger entry'}
                  subtitle={`${won ? 'You won' : 'You lost'} · settled · ${relativeTime(e.createdAt)}`}
                  value={`${won ? '+' : '−'}${formatMoney(Math.abs(e.amountCents), e.currency)}`}
                  valueColor={won ? colors.semantic.win : colors.semantic.loss}
                  onPress={() => navigation.navigate('TransactionDetail', { id: e.id })}
                />
              );
            })}
          </>
        )}

        {nothingYet && (
          <EmptyState
            icon="scales"
            title="No ledger with them yet"
            body="Once a money bet between the two of you is settled, it lands here."
          />
        )}
      </ScrollView>

      <ActionSheet
        visible={!!sheetFor}
        title={sheetFor?.betTitle ?? 'Ledger entry'}
        options={sheetFor ? sheetOptions(sheetFor) : []}
        onDismiss={() => setSheetFor(null)}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.screenGutter,
    gap: spacing[3],
    paddingBottom: spacing[8],
  },
  hero: {
    alignItems: 'center',
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.md,
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[4],
    gap: spacing[1],
  },
  name: {
    fontFamily: 'Barlow-Bold',
    fontSize: 20,
    color: colors.text.primary,
    marginTop: spacing[2],
  },
  handle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.text.tertiary,
  },
  square: {
    fontFamily: 'Barlow-Black',
    fontSize: 22,
    color: colors.text.secondary,
    marginTop: spacing[3],
  },
  standing: {
    alignItems: 'center',
    marginTop: spacing[3],
  },
  standingLabel: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.text.tertiary,
  },
  standingAmount: {
    fontFamily: 'Barlow-Black',
    fontSize: 40,
    letterSpacing: -0.8,
    marginTop: 2,
  },
  note: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: spacing[3],
  },
  section: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
    marginTop: spacing[2],
  },
  hint: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.text.tertiary,
  },
});
