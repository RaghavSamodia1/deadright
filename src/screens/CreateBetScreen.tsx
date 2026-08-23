import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, radius } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  ProgressDots,
  TextInput,
  SuggestionCard,
  ChoiceChipGroup,
  GroupCard,
  BetCard,
  Button,
  type BetCardData,
} from '../components';
import { createBet } from '../api/bets';
import { addOptions } from '../api/ordinals';
import { getMyGroups } from '../api/groups';
import { sharpen } from '../api/sharpen';
import { getSettings } from '../api/settings';
import { getMyProfile } from '../api/profile';
import { currencySymbol, formatMoney, parseAmountToCents } from '../lib/money';
import { useQuery, useAction } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';
import { humanError } from '../lib/errors';
import { findDeadline, shortDate } from '../lib/parseDate';

type BetType = 'binary' | 'overunder' | 'ordinal';
const TYPE_OPTS: { value: BetType; label: string }[] = [
  { value: 'binary', label: 'Yes / No' },
  { value: 'overunder', label: 'Over / Under' },
  { value: 'ordinal', label: 'Ranking' },
];
type Deadline = '1h' | '24h' | '1w' | 'custom' | 'read';
const DEADLINE_OPTS: { value: Deadline; label: string }[] = [
  { value: '1h', label: 'In 1 hour' },
  { value: '24h', label: 'Tomorrow' },
  { value: '1w', label: 'Next week' },
  { value: 'custom', label: 'Pick a date' },
];
type Stake = 'brag' | 'coffee' | 'beer' | 'money' | 'custom';
const STAKE_OPTS: { value: Stake; label: string }[] = [
  { value: 'brag', label: 'Bragging rights' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'beer', label: 'Round' },
  { value: 'money', label: 'A tenner' },
  { value: 'custom', label: 'Custom amount' },
];
/** The preset money option. Custom overrides this with whatever they type. */
const TENNER_CENTS = 1000;

/**
 * Four steps, not six.
 *
 * Type, Deadline and Stake were a screen each, and all three are the same
 * thing: a row of chips with a sensible default already selected. Three taps of
 * Next to confirm three defaults is ceremony, not a flow — and the deadline is
 * usually answered before you get there anyway, because it is read out of the
 * statement. They are one Details step now.
 *
 * Statement and Group stay separate on purpose. Statement is the only screen
 * where anything is written, and it carries the AI suggestion; Group is a real
 * gate rather than a formality, since a bet with no group has no audience and
 * nobody to take the other side. Review stays because it is the last place the
 * card is seen as it will actually appear — that preview is what caught the
 * deadline showing 23:59 for every custom date.
 */
const ALL_STEPS = ['Statement', 'Details', 'Group', 'Review'];

export function CreateBetScreen({ navigation, route }: any) {
  // Started from inside a group: that group is the answer, so asking again is
  // a step that can only be got wrong. The param was already being passed —
  // this screen simply never read it.
  const fromGroup: string | undefined = route?.params?.groupId;
  const STEPS = fromGroup ? ALL_STEPS.filter((x) => x !== 'Group') : ALL_STEPS;

  const [step, setStep] = useState(0);
  // Steps are addressed by name from here on. They used to be addressed by
  // index, which silently mis-rendered the moment a step was dropped.
  const at = (name: string) => STEPS[step] === name;
  const [statement, setStatement] = useState('');
  const [sharpened, setSharpened] = useState<string | null>(null);
  // The AI suggestion used to be fabricated on-device: it appended
  // "— resolved by the final Premier League table." to whatever you typed, so a
  // cricket call got told it settles on the Premier League table. Now it asks
  // the sharpen function and shows nothing when there is nothing real to show.
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [rejected, setRejected] = useState(false);
  const [type, setType] = useState<BetType>('binary');
  const [deadline, setDeadline] = useState<Deadline>('24h');
  const [stake, setStake] = useState<Stake>('brag');
  // Nothing ever performed the auto-selection this used to claim, so tapping
  // straight through the Group step created a bet with group_id null — a bet
  // nobody can see or take the other side of, in an app whose whole premise is
  // that everything lives in a group. The first group is now really selected.
  const [group, setGroup] = useState<string>(fromGroup ?? '');
  const [rankOptions, setRankOptions] = useState<string[]>(['', '']);
  /**
   * Over/under is a call bet: everyone names their own number or date and the
   * closest wins. It needs to know what is being counted, or the calls are
   * bare figures — "3.5" on a card tells you nothing on its own.
   */
  const [callKind, setCallKind] = useState<'number' | 'date'>('number');
  const [callUnit, setCallUnit] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  // A real calendar. This was a "days from now" number field, which is a
  // workaround for a date picker rather than a way to answer "when do we know?"
  // — nobody thinks about a match or a deadline in days from today.
  const [customDate, setCustomDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(23, 59, 0, 0);
    return d;
  });
  const [pickerOpen, setPickerOpen] = useState(false);

  /**
   * The deadline is nearly always already in the sentence — "by October end",
   * "tomorrow", "15 Oct" — so it is read out of the statement and offered as a
   * chip rather than asked for a second time.
   *
   * It is offered, never imposed: the chip carries the date it read, the hint
   * underneath carries the words it read it from, and the moment the user picks
   * anything else the reading stops overriding them. A deadline set silently
   * from a misread sentence is exactly the kind of confident wrong number this
   * app is not allowed to produce.
   */
  const read = React.useMemo(
    () => findDeadline(sharpened || statement),
    [statement, sharpened],
  );
  const [deadlineTouched, setDeadlineTouched] = useState(false);
  useEffect(() => {
    if (deadlineTouched) return;
    if (read) setDeadline('read');
    else setDeadline((d) => (d === 'read' ? '24h' : d));
  }, [read?.date.getTime(), deadlineTouched]);

  // Stakes are ledger-only, but they should still read in the user's own
  // currency rather than a hardcoded pound sign.
  const { data: settings } = useQuery(getSettings, { currency: 'GBP' } as any);
  const symbol = currencySymbol(settings?.currency);
  const customCents = parseAmountToCents(customAmount);

  // 'RS' was hardcoded here — the author's own initials shipped as everyone's
  // preview avatar.
  const { data: me } = useQuery(getMyProfile, null as any);
  const myInitials = ((me as any)?.display_name ?? (me as any)?.handle ?? 'You')
    .slice(0, 2)
    .toUpperCase();

  const MOCK_GROUPS = [
    { id: 'g1', emoji: '⚽', name: 'Sunday League', memberCount: 8, members: [{ initials: 'MC' }, { initials: 'PR' }, { initials: 'DJ' }] },
    { id: 'g2', emoji: '🏠', name: 'Flatmates', memberCount: 5, members: [{ initials: 'AB' }, { initials: 'JK' }] },
  ];

  const { data: groups, isMock: groupsAreMock } = useQuery(
    async () =>
      (await getMyGroups()).map((g: any) => ({
        id: g.id,
        emoji: g.emoji ?? '👥',
        name: g.name,
        memberCount: g.members?.length ?? 0,
        members: (g.members ?? []).slice(0, 4).map((m: any) => ({
          initials: (m.profile?.display_name ?? m.profile?.handle ?? '??')
            .slice(0, 2)
            .toUpperCase(),
        })),
      })),
    MOCK_GROUPS,
  );

  const { run: publish, loading: publishing, error: publishError } = useAction(createBet);

  // Clamp forward: a deadline in the past would arrive already expired.
  const customMs = Math.max(60_000, customDate.getTime() - Date.now());
  const DEADLINE_MS: Record<Deadline, number> = {
    '1h': 3600_000,
    '24h': 86_400_000,
    '1w': 604_800_000,
    custom: customMs,
    read: read ? Math.max(60_000, read.date.getTime() - Date.now()) : 86_400_000,
  };

  // The read date leads, because when there is one it is nearly always right.
  const deadlineOpts = read
    ? [{ value: 'read' as Deadline, label: shortDate(read.date) }, ...DEADLINE_OPTS]
    : DEADLINE_OPTS;

  const isMoneyStake = stake === 'money' || stake === 'custom';

  const submit = async () => {
    if (!isBackendConfigured) return navigation.replace('BetPlaced');
    const bet = await publish({
      groupId: group || null,
      title: (sharpened || statement).trim(),
      type: type === 'ordinal' ? 'ordinal' : 'prediction',
      // Over/under has no yes and no in it, and no sides either: it is a call
      // bet, and call_kind is what makes it one.
      ...(type === 'overunder'
        ? { callKind, callUnit: callUnit.trim() || undefined }
        : {}),
      stakeKind: isMoneyStake ? 'money' : 'dare',
      stakeAmountCents: isMoneyStake
        ? (stake === 'custom' ? customCents! : TENNER_CENTS)
        : undefined,
      dareForfeit: isMoneyStake
        ? undefined
        : STAKE_OPTS.find((s) => s.value === stake)?.label,
      deadline: new Date(Date.now() + DEADLINE_MS[deadline]),
    });
    if (!bet) return;

    // A ranking bet is meaningless without the things being ranked.
    if (type === 'ordinal') {
      const labels = rankOptions.map((o) => o.trim()).filter(Boolean);
      if (labels.length >= 2) await addOptions(bet.id, labels);
    }
    navigation.replace('BetPlaced', { id: bet.id });
  };

  // A ranking bet needs at least two things to rank before it can go further.
  // Details carries what used to be three separate gates, so it fails if any
  // of them would have: a call bet needs a unit or every answer is a bare
  // figure, a ranking needs things to rank, and a custom stake with no usable
  // number would post NaN cents.
  const detailsOk =
    (type !== 'overunder' || callUnit.trim().length > 0) &&
    (type !== 'ordinal' || rankOptions.filter((o) => o.trim()).length >= 2) &&
    (stake !== 'custom' || customCents !== null);

  const canNext = at('Statement')
    ? statement.trim().length > 4
    : at('Details')
      ? detailsOk
      : // A bet with no group has no audience and no opposing side, so the
        // Group step is a real gate rather than a formality.
        at('Group')
        ? !!group
        : true;
  const preview: BetCardData = {
    id: 'preview',
    title: sharpened || statement || 'Your call goes here…',
    status: 'awaiting',
    author: { handle: 'You', initials: myInitials },
    group: groups.find((g) => g.id === group)?.name,
    sideAPercent: 50, sideACount: 0, sideBCount: 0, participantCount: 1,
    stake:
      stake === 'custom'
        ? (customCents !== null ? formatMoney(customCents, settings?.currency) : undefined)
        : STAKE_OPTS.find((s) => s.value === stake)?.label.split(' ')[0],
    // The preview used a hardcoded 24h, so the Review card showed "23:59"
    // whatever you picked — including a custom date three days out. The submit
    // below always used the real value, so the card disagreed with the bet it
    // was previewing at the one moment you check it.
    deadline: new Date(Date.now() + DEADLINE_MS[deadline]),
  };

  useEffect(() => {
    // Only ever seed from real data. `data` starts out as the mock fallback, so
    // auto-selecting without this check latched onto the mock id "g1" on the
    // first render and never corrected once the real groups arrived — the
    // insert then failed with `invalid input syntax for type uuid: "g1"`.
    if (groupsAreMock) return;
    if (!group && groups.length > 0) setGroup(groups[0].id);
  }, [groups, group, groupsAreMock]);

  // Debounced: the user is still typing, and sharpen is a network call.
  useEffect(() => {
    const text = statement.trim();
    if (text.length < 15 || sharpened || rejected) {
      setSuggestion(null);
      return;
    }
    let alive = true;
    const t = setTimeout(() => {
      sharpen(text, type === 'binary' ? 'prediction' : 'open')
        .then((r) => {
          // Only surface a rewrite that actually differs from what they wrote.
          if (!alive || !r?.sharpened || r.sharpened.trim() === text) return;
          setSuggestion(r.sharpened.trim());
        })
        .catch(() => {});
    }, 700);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statement, type, sharpened, rejected]);

  const next = () => (step === STEPS.length - 1 ? submit() : setStep(step + 1));
  const back = () => (step === 0 ? navigation.goBack() : setStep(step - 1));

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="modal" title={STEPS[step]} onBack={() => navigation.goBack()} />
      <ProgressDots total={STEPS.length} current={step} style={styles.dots} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        {at('Statement') && (
          <>
            <Text style={styles.q}>What's the bet?</Text>
            <TextInput
              placeholder="e.g. Arsenal finish top 4 this season"
              value={statement}
              onChangeText={(t) => { setStatement(t); setSharpened(null); setRejected(false); }}
              multiline
              maxChars={140}
              showCounter
              autoFocus
            />
            {suggestion && !sharpened && !rejected && (
              <SuggestionCard
                suggestion={suggestion}
                onAccept={() => setSharpened(suggestion)}
                onReject={() => setRejected(true)}
              />
            )}
          </>
        )}

        {at('Details') && (
          <>
            <Text style={styles.q}>How is it settled?</Text>
            <ChoiceChipGroup options={TYPE_OPTS} value={type} onChange={setType} />

            {type === 'overunder' && (
              <>
                <Text style={styles.hint}>
                  Nobody picks a side. Everyone names their own answer and whoever
                  lands closest wins — if two of you are equally close, you both do.
                </Text>
                <ChoiceChipGroup
                  options={[
                    { value: 'number' as const, label: 'A number' },
                    { value: 'date' as const, label: 'A date' },
                  ]}
                  value={callKind}
                  onChange={setCallKind}
                />
                <TextInput
                  label={callKind === 'number' ? 'What are we counting?' : 'What are we dating?'}
                  placeholder={callKind === 'number' ? 'e.g. goals' : 'e.g. he starts'}
                  value={callUnit}
                  onChangeText={setCallUnit}
                  maxChars={24}
                />
              </>
            )}

            {type === 'ordinal' && (
              <>
                <Text style={styles.hint}>
                  List what's being ranked. Everyone predicts an order, and you score on
                  how close you land — not just exact hits.
                </Text>
                {rankOptions.map((o, i) => (
                  <TextInput
                    key={i}
                    placeholder={`Option ${i + 1}`}
                    value={o}
                    onChangeText={(v) =>
                      setRankOptions((prev) => prev.map((x, idx) => (idx === i ? v : x)))
                    }
                    maxChars={60}
                  />
                ))}
                {rankOptions.length < 8 && (
                  <Text
                    style={styles.addOption}
                    onPress={() => setRankOptions((p) => [...p, ''])}
                  >
                    + Add another
                  </Text>
                )}
              </>
            )}

            <Text style={styles.q}>When do we know?</Text>
            <ChoiceChipGroup
              options={deadlineOpts}
              value={deadline}
              onChange={(v) => { setDeadlineTouched(true); setDeadline(v); }}
            />
            {read && deadline === 'read' && (
              <Text style={styles.hint}>
                Read &ldquo;{read.matched}&rdquo; from your bet. Pick another if that&rsquo;s not it.
              </Text>
            )}
            {deadline === 'custom' && (
              <>
                <Pressable
                  onPress={() => setPickerOpen(true)}
                  style={styles.dateField}
                  accessibilityRole="button"
                  accessibilityLabel="Choose the deadline date"
                >
                  <Text style={styles.dateLabel}>Deadline</Text>
                  <Text style={styles.dateValue}>
                    {customDate.toLocaleDateString(undefined, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </Pressable>

                {/* iOS renders inline and stays open; Android puts up its own
                    dialog and closes itself, so it is only mounted on demand. */}
                {(pickerOpen || Platform.OS === 'ios') && (
                  <DateTimePicker
                    value={customDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    minimumDate={new Date()}
                    themeVariant="dark"
                    accentColor={colors.semantic.awaiting}
                    onChange={(_event, picked) => {
                      if (Platform.OS !== 'ios') setPickerOpen(false);
                      if (!picked) return;
                      // Keep the end-of-day time; the calendar only sets a date.
                      const next = new Date(picked);
                      next.setHours(23, 59, 0, 0);
                      setCustomDate(next);
                    }}
                  />
                )}
              </>
            )}

            <Text style={styles.q}>What’s at stake?</Text>
            <Text style={styles.hint}>No real money moves — it’s tracked on the ledger.</Text>
            <ChoiceChipGroup options={STAKE_OPTS} value={stake} onChange={setStake} />
            {stake === 'custom' && (
              <TextInput
                label={`How much? (${symbol})`}
                placeholder="25"
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="decimal-pad"
                autoFocus
                error={
                  customAmount.length > 0 && customCents === null
                    ? `Enter an amount between ${symbol}0.01 and ${symbol}10,000`
                    : undefined
                }
              />
            )}
          </>
        )}

        {at('Group') && (
          <>
            <Text style={styles.q}>Who’s in?</Text>
            {groups.length === 0 ? (
              <>
                <Text style={styles.hint}>
                  A call needs someone to argue with. Make a group or join one with a
                  code, then come back to this.
                </Text>
                <Button
                  label="Create a group"
                  onPress={() => navigation.navigate('CreateGroup')}
                  fullWidth
                />
                <Button
                  label="I have an invite code"
                  onPress={() => navigation.navigate('JoinGroup')}
                  variant="secondary"
                  fullWidth
                />
              </>
            ) : (
              groups.map((g) => (
                <GroupCard key={g.id} {...g} selected={group === g.id} onPress={() => setGroup(g.id)} />
              ))
            )}
          </>
        )}

        {at('Review') && (
          <>
            <Text style={styles.q}>Lock it in?</Text>
            <BetCard bet={preview} onPress={() => {}} />
            <Text style={styles.hint}>Once you publish, the clock starts and everyone gets pinged.</Text>
            {publishError && <Text style={styles.error}>{humanError(publishError)}</Text>}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button label={step === 0 ? 'Cancel' : 'Back'} onPress={back} variant="ghost" />
        <Button
          label={step === STEPS.length - 1 ? 'Send it' : 'Next'}
          onPress={next}
          disabled={!canNext}
          loading={publishing}
          style={styles.nextBtn}
        />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  helper: { fontFamily: 'Inter-Regular', fontSize: 13, color: colors.text.tertiary },
  dateField: {
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.md,
    padding: spacing[4],
    gap: 4,
  },
  dateLabel: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.semantic.awaiting,
  },
  dateValue: { fontFamily: 'Barlow-Bold', fontSize: 17, color: colors.text.primary },
  dots: { alignSelf: 'center', marginVertical: spacing[3] },
  // Without flex:1 the ScrollView sizes to its content, so a taller step —
  // the custom-amount field, the custom-date field — pushed the Back/Next
  // footer down off the fold and made you scroll to reach it.
  scroll: { flex: 1 },
  content: { padding: spacing.screenGutter, gap: spacing[4], paddingBottom: spacing[8] },
  q: {
    fontFamily: 'Barlow-Bold',
    fontSize: 22,
    color: colors.text.primary,
    letterSpacing: -0.3,
  },
  error: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.interactive.destructive,
  },
  addOption: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 14,
    color: colors.text.link,
    paddingVertical: 8,
  },
  hint: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.text.tertiary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.screenGutter,
    paddingBottom: spacing[6],
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  nextBtn: { minWidth: 120 },
});
