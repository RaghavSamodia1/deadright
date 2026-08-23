import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Pressable } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ScreenBackground, NavHeader, ChoiceChipGroup, TextInput, Banner, Button } from '../components';
import { proposeOutcome } from '../api/resolution';
import { useAction, useQuery } from '../hooks/useQuery';
import { isBackendConfigured, uidOrNull } from '../lib/supabase';
import { getBet, resolveClosest } from '../api/bets';
import { humanError } from '../lib/errors';

// No push: bet_side is enum ('a','b') and winning_side takes one of them, so a
// draw has nowhere to go. Offering it recorded Side B as the winner, which
// silently resolved the bet against whoever was on Side A. Better to not offer
// an outcome the model cannot represent than to record the wrong one.
type Outcome = 'won' | 'lost';
const OPTS: { value: Outcome; label: string }[] = [
  { value: 'won', label: 'I was right' },
  { value: 'lost', label: 'They were right' },
];

// Resolution — propose the outcome. Both sides must agree (agree_outcome RPC).
export function ResolutionScreen({ navigation, route }: any) {
  const title = route?.params?.title ?? 'Arsenal finish top 4 this season';
  const betId = route?.params?.id ?? route?.params?.betId;
  const [outcome, setOutcome] = useState<Outcome>('won');
  const [note, setNote] = useState('');

  /**
   * A call bet is not resolved by picking a side — there are none. It is
   * resolved by saying what actually happened, and the closest call wins.
   */
  const callKind: 'number' | 'date' | null = route?.params?.callKind ?? null;
  const callUnit: string | undefined = route?.params?.callUnit;
  const [actualText, setActualText] = useState('');
  const [actualDate, setActualDate] = useState<Date>(new Date());
  const [pickerOpen, setPickerOpen] = useState(false);
  const { run: settle, loading: settling, error: settleError } = useAction(resolveClosest);

  const actualNumber = actualText.trim() === '' ? null : Number(actualText.replace(',', '.'));
  const actualOk =
    callKind === 'number' ? actualNumber !== null && Number.isFinite(actualNumber) : true;
  const { run: propose, loading, error } = useAction(proposeOutcome);

  // Which side the viewer is actually on. This used to be hardcoded to 'a', so
  // anyone on Side B choosing "I called it" proposed that the *other* side won.
  const { data: mySide } = useQuery<'a' | 'b' | null>(
    async () => {
      if (!betId) return null;
      const [bet, uid] = await Promise.all([getBet(betId), uidOrNull()]);
      const mine = (bet?.participants ?? []).find((p: any) => p.user_id === uid);
      return (mine?.side as 'a' | 'b') ?? null;
    },
    null,
    [betId],
  );

  const submitCall = async () => {
    if (!betId) return;
    const ok = await settle(
      betId,
      callKind === 'number' ? { number: actualNumber! } : { date: actualDate },
    );
    if (ok !== null) navigation.goBack();
  };

  const submit = async () => {
    if (!isBackendConfigured || !betId) {
      return navigation.replace(outcome === 'won' ? 'Win' : 'Root', { betId });
    }
    const me = mySide ?? 'a';
    const other = me === 'a' ? 'b' : 'a';
    const side = outcome === 'won' ? me : other;
    const bet = await propose(betId, side, note || undefined);
    if (!bet) return;
    // propose_outcome only *proposes*: it moves the bet to pending_agreement and
    // the other side still has to agree. Celebrating here showed "CALLED IT —
    // you were dead right" for a result nobody had accepted yet.
    if (bet.status === 'resolved' && outcome === 'won') {
      navigation.replace('Win', { betId });
    } else {
      navigation.goBack();
    }
  };

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="back" title="Resolve" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        <Text style={styles.statement}>"{title}"</Text>

        {callKind ? (
          <>
            <Banner
              tone="awaiting"
              title="Closest call wins"
              body="Say what actually happened and the nearest answer takes it. If two are equally close they both win, and the stake splits."
            />
            {callKind === 'number' ? (
              <TextInput
                label={callUnit ? `How many ${callUnit}?` : 'What was the number?'}
                value={actualText}
                onChangeText={setActualText}
                keyboardType="decimal-pad"
                placeholder="e.g. 3"
                autoFocus
              />
            ) : (
              <>
                <Pressable
                  onPress={() => setPickerOpen(true)}
                  style={styles.dateField}
                  accessibilityRole="button"
                  accessibilityLabel="Choose what actually happened"
                >
                  <Text style={styles.dateLabel}>
                    {callUnit ? `When ${callUnit}?` : 'What was the date?'}
                  </Text>
                  <Text style={styles.dateValue}>
                    {actualDate.toLocaleDateString(undefined, {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </Text>
                </Pressable>
                {(pickerOpen || Platform.OS === 'ios') && (
                  <DateTimePicker
                    value={actualDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    themeVariant="dark"
                    accentColor={colors.semantic.awaiting}
                    onChange={(_e, picked) => {
                      if (Platform.OS !== 'ios') setPickerOpen(false);
                      if (picked) setActualDate(picked);
                    }}
                  />
                )}
              </>
            )}
          </>
        ) : (
          <>
            <Banner
              tone="awaiting"
              title="Both sides confirm"
              body="Your proposal goes to the other side. If they disagree, it opens for a group vote."
            />

            <Text style={styles.q}>How did it land?</Text>
            <ChoiceChipGroup options={OPTS} value={outcome} onChange={setOutcome} />
          </>
        )}

        <TextInput
          label="Add a note (optional)"
          placeholder="Final table had them 4th on GD…"
          value={note}
          onChangeText={setNote}
          multiline
          maxChars={120}
        />

        <Button
          label="Attach evidence"
          onPress={() => navigation.navigate('EvidenceUpload', { title, outcome, betId })}
          variant="secondary"
          fullWidth
        />
        {(error || settleError) && (
          <Text style={styles.error}>{humanError(error ?? settleError)}</Text>
        )}
        <Button
          label={callKind ? 'Settle it' : 'Submit resolution'}
          onPress={callKind ? submitCall : submit}
          disabled={callKind ? !actualOk : false}
          loading={loading || settling}
          fullWidth
        />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  dateField: {
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[4],
    gap: 4,
  },
  dateLabel: {
    fontFamily: 'Barlow-SemiBold', fontSize: 11, letterSpacing: 2,
    textTransform: 'uppercase', color: colors.semantic.awaiting,
  },
  dateValue: { fontFamily: 'Barlow-Bold', fontSize: 17, color: colors.text.primary },
  content: { padding: spacing.screenGutter, gap: spacing[4], paddingBottom: spacing[8] },
  statement: {
    fontFamily: 'Barlow-Bold',
    fontSize: 19,
    lineHeight: 26,
    color: colors.text.primary,
  },
  q: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.semantic.awaiting,
  },
  error: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.interactive.destructive,
  },
});
