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
import {
  getLedgerWith,
  settleUpWith,
  markSettled,
  deleteEntry,
  acceptEntry,
  declineEntry,
  unsettleEntry,
  type PersonEntry,
} from '../api/ledger';
import { useQuery } from '../hooks/useQuery';
import { formatMoney, totalsByCurrency } from '../lib/money';
import { plural, relativeTime } from '../lib/plural';
import { humanError } from '../lib/errors';

/**
 * Everything between you and one other person: what it comes to, what is still
 * open, what one of you has claimed and the other has not answered, and what
 * has already been closed off.
 *
 * The ledger could say "you owe Test Mate £14" but never why. Answering that
 * meant reading the whole transaction list and picking out the rows with their
 * name on — the exact arithmetic the balances were added to save people from.
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

  /** Which row is mid-write — an entry id, or `all:GBP`. */
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

  const askedOfMe = entries.filter((e) => e.awaitingMe);
  const askedOfThem = entries.filter((e) => e.status === 'proposed' && !e.awaitingMe);
  const open = entries.filter((e) => e.status === 'pending');
  const settled = entries.filter((e) => e.status === 'settled');

  // Per currency, because a ₹ debt and a £ debt with the same person are two
  // debts. Zero totals are kept: two open entries that cancel out are still two
  // open entries somebody has to close.
  const openCurrencies = [...new Set(open.map((e) => e.currency))];
  const netByCurrency = totalsByCurrency(
    open.map((e) => ({ currency: e.currency, cents: e.amountCents })),
  );

  /** A bet lends its title; a hand-recorded entry carries its own note. */
  const label = (e: PersonEntry) => e.betTitle ?? e.note ?? 'Ledger entry';
  const money = (e: PersonEntry) =>
    `${e.amountCents >= 0 ? '+' : '−'}${formatMoney(Math.abs(e.amountCents), e.currency)}`;

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

  const confirmDelete = (e: PersonEntry) =>
    Alert.alert(
      'Delete this entry?',
      `"${label(e)}" disappears for both of you. Nothing that came from a bet can be deleted — this one was recorded by hand, so it can.`,
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => run(e.id, () => deleteEntry(e.id), 'Couldn’t delete that'),
        },
      ],
    );

  const confirmDecline = (e: PersonEntry) =>
    Alert.alert(
      `Turn down "${label(e)}"?`,
      `${displayName} is told you didn't agree, and the entry goes. Nothing is recorded either way.`,
      [
        { text: 'Back', style: 'cancel' },
        {
          text: "Didn't happen",
          style: 'destructive',
          onPress: () => run(e.id, () => declineEntry(e.id), 'Couldn’t turn that down'),
        },
      ],
    );

  const sheetOptions = (e: PersonEntry): ActionSheetOption[] => {
    if (e.status === 'settled') {
      return [
        {
          label: 'Reopen it',
          onPress: () => run(e.id, () => unsettleEntry(e.id), 'Couldn’t reopen that'),
        },
        {
          label: 'Open transaction',
          onPress: () => navigation.navigate('TransactionDetail', { id: e.id }),
        },
      ];
    }
    if (e.status === 'proposed') {
      // Yours to withdraw, not to agree with.
      return [
        { label: 'Withdraw it', destructive: true, onPress: () => confirmDelete(e) },
      ];
    }
    return [
      {
        label: 'Mark settled',
        primary: true,
        onPress: () => run(e.id, () => markSettled(e.id), 'Couldn’t settle that item'),
      },
      {
        label: 'Open transaction',
        onPress: () => navigation.navigate('TransactionDetail', { id: e.id }),
      },
      ...(e.isManual
        ? [{ label: 'Delete', destructive: true, onPress: () => confirmDelete(e) }]
        : []),
    ];
  };

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

        {/* Asked of you. A decision, so both answers are on screen rather than
            hidden behind a tap. */}
        {askedOfMe.length > 0 && (
          <>
            <Text style={styles.section}>WAITING ON YOU</Text>
            {askedOfMe.map((e) => (
              <View key={e.id} style={styles.proposal}>
                <Text style={styles.proposalTitle}>{label(e)}</Text>
                <Text style={styles.proposalLine}>
                  {displayName} says{' '}
                  {e.amountCents >= 0 ? 'they owe you' : 'you owe them'}{' '}
                  <Text style={styles.proposalAmount}>
                    {formatMoney(Math.abs(e.amountCents), e.currency)}
                  </Text>
                  {' · '}
                  {relativeTime(e.createdAt)}
                </Text>
                <View style={styles.proposalActions}>
                  <Button
                    label="That's right"
                    variant="primary"
                    size="sm"
                    loading={busy === e.id}
                    onPress={() => run(e.id, () => acceptEntry(e.id), 'Couldn’t accept that')}
                    style={styles.grow}
                  />
                  <Button
                    label="It isn't"
                    variant="secondary"
                    size="sm"
                    onPress={() => confirmDecline(e)}
                    style={styles.grow}
                  />
                </View>
              </View>
            ))}
            <Text style={styles.hint}>
              Nothing counts towards your balance until you agree with it.
            </Text>
          </>
        )}

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

        <Button
          label="Record something"
          variant="secondary"
          fullWidth
          onPress={() =>
            navigation.navigate('RecordEntry', { userId, handle, displayName })
          }
        />

        {open.length > 0 && (
          <>
            <Text style={styles.section}>STILL OPEN</Text>
            {open.map((e) => {
              const owed = e.amountCents >= 0;
              return (
                <ListRow
                  key={e.id}
                  title={label(e)}
                  subtitle={`${owed ? 'Owes you' : 'You owe'}${
                    e.isManual ? ' · recorded' : ''
                  } · ${relativeTime(e.createdAt)}`}
                  value={money(e)}
                  valueColor={owed ? colors.semantic.win : colors.semantic.disputed}
                  onPress={() => setSheetFor(e)}
                />
              );
            })}
            <Text style={styles.hint}>Tap an item to settle it on its own.</Text>
          </>
        )}

        {/* Yours, still unanswered. Greyed, because it is not money yet. */}
        {askedOfThem.length > 0 && (
          <>
            <Text style={styles.section}>WAITING ON {displayName.toUpperCase()}</Text>
            {askedOfThem.map((e) => (
              <ListRow
                key={e.id}
                title={label(e)}
                subtitle={`Not agreed yet · ${relativeTime(e.createdAt)}`}
                value={money(e)}
                valueColor={colors.text.tertiary}
                onPress={() => setSheetFor(e)}
              />
            ))}
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
                  title={label(e)}
                  subtitle={`${
                    e.isManual ? (won ? 'Owed you' : 'You owed') : won ? 'You won' : 'You lost'
                  } · settled · ${relativeTime(e.createdAt)}`}
                  value={money(e)}
                  valueColor={won ? colors.semantic.win : colors.semantic.loss}
                  onPress={() => setSheetFor(e)}
                />
              );
            })}
          </>
        )}

        {nothingYet && (
          <EmptyState
            icon="scales"
            title="No ledger with them yet"
            body="Settle a money bet between the two of you, or record something that wasn't a bet."
          />
        )}
      </ScrollView>

      <ActionSheet
        visible={!!sheetFor}
        title={sheetFor ? label(sheetFor) : 'Ledger entry'}
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
  standing: { alignItems: 'center', marginTop: spacing[3] },
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
  proposal: {
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.semantic.awaiting,
    padding: spacing[4],
    gap: spacing[2],
  },
  proposalTitle: {
    fontFamily: 'Barlow-Bold',
    fontSize: 16,
    color: colors.text.primary,
  },
  proposalLine: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.secondary,
  },
  proposalAmount: {
    fontFamily: 'Inter-Medium',
    color: colors.text.primary,
  },
  proposalActions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  grow: { flex: 1 },
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
