import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  ListRow,
  Avatar,
  Button,
  TextInput,
  SegmentedControl,
  ActionSheet,
} from '../components';
import { recordEntry } from '../api/ledger';
import { getMyGroups } from '../api/groups';
import { useQuery } from '../hooks/useQuery';
import { useCurrency } from '../hooks/useCurrency';
import { formatMoney, currencySymbol, parseAmountToCents } from '../lib/money';
import { humanError } from '../lib/errors';
import { uidOrNull } from '../lib/supabase';

type Person = {
  userId: string;
  handle: string;
  displayName: string;
  /** The shared group's unit. Empty when two groups disagree — see below. */
  currency: string;
};

/**
 * Write down something that was not a bet.
 *
 * The ledger only ever filled itself — a row appeared when a bet resolved or a
 * violation was logged — so two people who split a taxi had nowhere to put it,
 * and the balance between them was only ever true about the betting. This makes
 * the same kind of row by hand. It nets into the same balance and settles the
 * same way, because it is the same row.
 */
export function RecordEntryScreen({ navigation, route }: any) {
  const myCurrency = useCurrency();
  const fixedUserId: string | undefined = route?.params?.userId;

  const { data: people } = useQuery<Person[]>(async () => {
    const [groups, uid] = await Promise.all([getMyGroups(), uidOrNull()]);
    const by = new Map<string, Person>();
    for (const g of (groups ?? []) as any[]) {
      const code = (g.currency ?? 'GBP').toUpperCase();
      for (const m of g.members ?? []) {
        if (!m.user_id || m.user_id === uid) continue;
        const seen = by.get(m.user_id);
        if (seen) {
          // Shared across two groups that disagree on currency. There is no
          // right default, so fall back to the viewer's own rather than
          // guessing and quietly splitting their balance in two.
          if (seen.currency !== code) seen.currency = '';
          continue;
        }
        by.set(m.user_id, {
          userId: m.user_id,
          handle: m.profile?.handle ?? 'someone',
          displayName: m.profile?.display_name ?? m.profile?.handle ?? 'Someone',
          currency: code,
        });
      }
    }
    return [...by.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, []);

  const [personId, setPersonId] = React.useState<string | undefined>(fixedUserId);
  const [dir, setDir] = React.useState<'they' | 'me'>('they');
  const [amount, setAmount] = React.useState('');
  const [note, setNote] = React.useState('');
  const [picking, setPicking] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const person = people.find((p) => p.userId === personId);
  const code = person?.currency || myCurrency;
  const cents = parseAmountToCents(amount);
  const trimmedNote = note.trim();
  const ready = !!person && cents !== null && cents > 0 && trimmedNote.length > 0;

  const them = person?.displayName ?? 'they';
  const iOwe = dir === 'me';

  const save = async () => {
    if (!ready || !person || cents === null) return;
    setSaving(true);
    try {
      await recordEntry({
        otherUserId: person.userId,
        amountCents: cents,
        note: trimmedNote,
        iOwe,
        currency: code,
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('Couldn’t record that', humanError(e));
    } finally {
      setSaving(false);
    }
  };

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?';

  return (
    <ScreenBackground tone="base">
      <NavHeader
        variant="back"
        title="Record something"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Who. Fixed when you came here from someone's page. */}
        {fixedUserId ? (
          <View style={styles.who}>
            <Avatar
              size="sm"
              seed={person?.handle ?? them}
              initials={initials(them)}
            />
            <Text style={styles.whoName}>{them}</Text>
          </View>
        ) : (
          <ListRow
            left={
              person ? (
                <Avatar size="sm" seed={person.handle} initials={initials(them)} />
              ) : undefined
            }
            title={person ? person.displayName : 'Choose a person'}
            subtitle={person ? `@${person.handle}` : 'Anyone you share a group with'}
            showChevron
            onPress={() => setPicking(true)}
          />
        )}

        <SegmentedControl
          segments={[
            { value: 'they', label: 'They owe me' },
            { value: 'me', label: 'I owe them' },
          ]}
          value={dir}
          onChange={setDir}
        />

        <TextInput
          label={`Amount (${currencySymbol(code).trim()})`}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />

        <TextInput
          label="What for"
          value={note}
          onChangeText={setNote}
          maxChars={80}
          showCounter
          placeholder="Dinner at the Anchor"
        />

        {/* The direction is the one thing easy to get backwards, so say it back
            as a sentence before it goes anywhere. */}
        {ready && cents !== null && (
          <Text style={styles.summary}>
            {iOwe
              ? `You'll owe ${them} ${formatMoney(cents, code)} for ${trimmedNote}.`
              : `${them} will owe you ${formatMoney(cents, code)} for ${trimmedNote}.`}
          </Text>
        )}

        <Button
          label="Send it over"
          variant="primary"
          fullWidth
          disabled={!ready}
          loading={saving}
          onPress={save}
        />

        <Text style={styles.note}>
          Bookkeeping only. No money changes hands.{' '}
          {them === 'they' ? 'They' : them} has to agree before this counts towards
          either of your balances — until then it sits on their page waiting for an
          answer, and you can withdraw it.
        </Text>
      </ScrollView>

      <ActionSheet
        visible={picking}
        title="Who is this with?"
        options={people.map((p) => ({
          label: p.displayName,
          onPress: () => setPersonId(p.userId),
        }))}
        onDismiss={() => setPicking(false)}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.screenGutter,
    gap: spacing[4],
    paddingBottom: spacing[8],
  },
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.md,
    padding: spacing[4],
  },
  whoName: {
    fontFamily: 'Barlow-Bold',
    fontSize: 17,
    color: colors.text.primary,
  },
  summary: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 19,
    color: colors.semantic.awaiting,
  },
  note: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 16,
    color: colors.text.tertiary,
  },
});
