import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, Button, TextInput } from '../components';
import { joinSide, placeCall } from '../api/bets';
import { useAction } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';
import { humanError } from '../lib/errors';

type Side = 'a' | 'b' | null;

// Side selection sheet — pick which side of a bet you're on before it locks.
export function SideSelectionScreen({ navigation, route }: any) {
  const title = route?.params?.title ?? 'Arsenal finish top 4 this season';
  const betId = route?.params?.id ?? route?.params?.betId;
  const [side, setSide] = useState<Side>(null);
  const { run: join, loading, error } = useAction(joinSide);

  /**
   * A call bet has no sides to pick between — everyone names their own number
   * or date and the closest wins — so this screen becomes an input instead of
   * a pair of buttons.
   */
  const callKind: 'number' | 'date' | null = route?.params?.callKind ?? null;
  const callUnit: string | undefined = route?.params?.callUnit;
  const [callText, setCallText] = useState('');
  const [callDate, setCallDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const { run: call, loading: calling, error: callError } = useAction(placeCall);

  const callNumber = callText.trim() === '' ? null : Number(callText.replace(',', '.'));
  const numberOk = callNumber !== null && Number.isFinite(callNumber);
  const canSubmit = callKind ? (callKind === 'number' ? numberOk : true) : !!side;

  const submit = async () => {
    if (!canSubmit) return;
    if (!isBackendConfigured || !betId) {
      return navigation.replace('BetDetail', { id: betId });
    }
    if (callKind) {
      const ok = await call(
        betId,
        callKind === 'number' ? { number: callNumber! } : { date: callDate },
      );
      if (ok !== null) navigation.replace('BetDetail', { id: betId });
      return;
    }
    if (!side) return;
    const joined = await join(betId, side);
    if (joined) navigation.replace('BetDetail', { id: betId });
  };

  const Option = ({ value, label, sub, color }: { value: Exclude<Side, null>; label: string; sub: string; color: string }) => (
    <Pressable
      onPress={() => setSide(value)}
      style={[
        styles.option,
        { borderColor: side === value ? color : colors.border.default, backgroundColor: side === value ? `${color}22` : colors.bg.surface1 },
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected: side === value }}
    >
      <Text style={[styles.optLabel, { color }]}>{label}</Text>
      <Text style={styles.optSub}>{sub}</Text>
    </Pressable>
  );

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader
        variant="modal"
        title={callKind ? 'Make your call' : 'Pick your side'}
        onBack={() => navigation.goBack()}
      />
      <View style={styles.root}>
        <Text style={styles.statement}>"{title}"</Text>

        {callKind === 'number' ? (
          <View style={styles.callBlock}>
            <TextInput
              label={callUnit ? `How many ${callUnit}?` : 'Your number'}
              value={callText}
              onChangeText={setCallText}
              keyboardType="decimal-pad"
              placeholder="e.g. 3"
              autoFocus
              helper="Closest wins. If two of you are equally close, you both do."
            />
          </View>
        ) : callKind === 'date' ? (
          <View style={styles.callBlock}>
            <Pressable
              onPress={() => setPickerOpen(true)}
              style={styles.dateField}
              accessibilityRole="button"
              accessibilityLabel="Choose the date you are calling"
            >
              <Text style={styles.dateLabel}>{callUnit ? `When ${callUnit}?` : 'Your date'}</Text>
              <Text style={styles.dateValue}>
                {callDate.toLocaleDateString(undefined, {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })}
              </Text>
            </Pressable>
            {(pickerOpen || Platform.OS === 'ios') && (
              <DateTimePicker
                value={callDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                themeVariant="dark"
                accentColor={colors.semantic.awaiting}
                onChange={(_e, picked) => {
                  if (Platform.OS !== 'ios') setPickerOpen(false);
                  if (picked) setCallDate(picked);
                }}
              />
            )}
            <Text style={styles.hint}>
              Closest wins. If two of you are equally close, you both do.
            </Text>
          </View>
        ) : (
          <View style={styles.options}>
            <Option value="a" label="YES" sub="You’re backing the call" color={colors.side.a} />
            <Option value="b" label="NO" sub="You’re fading it" color={colors.side.b} />
          </View>
        )}
        <View style={styles.footer}>
          <Button
            label={callKind ? 'Lock in my call' : 'Lock in my side'}
            onPress={submit}
            disabled={!canSubmit}
            loading={loading || calling}
            fullWidth
          />
          {(error || callError) && (
            <Text style={styles.error}>{humanError(error ?? callError)}</Text>
          )}
          {/* The lock warning is about sides. A call can be changed right up
              to the deadline — place_call replaces your answer rather than
              adding a second — so saying otherwise here would be a lie. */}
          <Text style={styles.warn}>
            {callKind
              ? 'You can change your call until the deadline.'
              : 'Once locked you can’t switch, but everyone sees if you try'}
          </Text>
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  callBlock: { gap: spacing[3] },
  dateField: {
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[4],
    gap: 4,
  },
  dateLabel: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.semantic.awaiting,
  },
  dateValue: { fontFamily: 'Barlow-Bold', fontSize: 17, color: colors.text.primary },
  hint: { fontFamily: 'Inter-Regular', fontSize: 12, lineHeight: 18, color: colors.text.tertiary },
  root: { flex: 1, padding: spacing.screenGutter },
  statement: {
    fontFamily: 'Barlow-Bold',
    fontSize: 20,
    lineHeight: 27,
    color: colors.text.primary,
    marginVertical: spacing[5],
  },
  // alignItems:'center' stops the cards stretching to the cross axis. With
  // flex:1 alone they grew to the full height left between the statement and
  // the footer — on a tall phone that was a ~700pt card with the label
  // stranded in the middle. The row still takes the space; the cards sit
  // centred inside it at their own height.
  options: { flexDirection: 'row', gap: spacing[3], flex: 1, alignItems: 'center' },
  option: {
    flex: 1,
    minHeight: 168,
    borderRadius: radius.lg,
    borderWidth: 2,
    padding: spacing[5],
    gap: spacing[2],
    justifyContent: 'center',
  },
  optLabel: { fontFamily: 'Barlow-Black', fontSize: 24 },
  optSub: { fontFamily: 'Inter-Regular', fontSize: 12, color: colors.text.secondary },
  footer: { gap: spacing[3], paddingBottom: spacing[6] },
  warn: { fontFamily: 'Inter-Regular', fontSize: 11, color: colors.text.tertiary, textAlign: 'center' },
  error: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.interactive.destructive,
    textAlign: 'center',
  },
});
