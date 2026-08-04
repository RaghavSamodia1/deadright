import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
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
import { currencySymbol, formatMoney, parseAmountToCents } from '../lib/money';
import { useQuery, useAction } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';
import { humanError } from '../lib/errors';

type BetType = 'binary' | 'overunder' | 'ordinal';
const TYPE_OPTS: { value: BetType; label: string }[] = [
  { value: 'binary', label: 'Yes / No' },
  { value: 'overunder', label: 'Over / Under' },
  { value: 'ordinal', label: 'Ranking' },
];
type Deadline = '1h' | '24h' | '1w' | 'custom';
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

const STEPS = ['Statement', 'Type', 'Deadline', 'Stake', 'Group', 'Review'];

export function CreateBetScreen({ navigation }: any) {
  const [step, setStep] = useState(0);
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
  const [group, setGroup] = useState<string>('');
  const [rankOptions, setRankOptions] = useState<string[]>(['', '']);
  const [customAmount, setCustomAmount] = useState('');

  // Stakes are ledger-only, but they should still read in the user's own
  // currency rather than a hardcoded pound sign.
  const { data: settings } = useQuery(getSettings, { currency: 'GBP' } as any);
  const symbol = currencySymbol(settings?.currency);
  const customCents = parseAmountToCents(customAmount);

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

  const DEADLINE_MS: Record<Deadline, number> = {
    '1h': 3600_000,
    '24h': 86_400_000,
    '1w': 604_800_000,
    custom: 86_400_000,
  };

  const isMoneyStake = stake === 'money' || stake === 'custom';

  const submit = async () => {
    if (!isBackendConfigured) return navigation.replace('BetPlaced');
    const bet = await publish({
      groupId: group || null,
      title: (sharpened || statement).trim(),
      type: type === 'ordinal' ? 'ordinal' : 'prediction',
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
  const canNext =
    step === 0
      ? statement.trim().length > 4
      : step === 1 && type === 'ordinal'
        ? rankOptions.filter((o) => o.trim()).length >= 2
        : // A custom stake with no usable number would post NaN cents.
          step === 3 && stake === 'custom'
          ? customCents !== null
          : // A bet with no group has no audience and no opposing side, so the
            // Group step is a real gate rather than a formality.
            step === 4
          ? !!group
          : true;
  const preview: BetCardData = {
    id: 'preview',
    title: sharpened || statement || 'Your call goes here…',
    status: 'awaiting',
    author: { handle: 'You', initials: 'RS' },
    group: groups.find((g) => g.id === group)?.name,
    sideAPercent: 50, sideACount: 0, sideBCount: 0, participantCount: 1,
    stake:
      stake === 'custom'
        ? (customCents !== null ? formatMoney(customCents, settings?.currency) : undefined)
        : STAKE_OPTS.find((s) => s.value === stake)?.label.split(' ')[0],
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24),
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

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 0 && (
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

        {step === 1 && (
          <>
            <Text style={styles.q}>How is it settled?</Text>
            <ChoiceChipGroup options={TYPE_OPTS} value={type} onChange={setType} />

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
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.q}>When do we know?</Text>
            <ChoiceChipGroup options={DEADLINE_OPTS} value={deadline} onChange={setDeadline} />
          </>
        )}

        {step === 3 && (
          <>
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

        {step === 4 && (
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

        {step === 5 && (
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
  dots: { alignSelf: 'center', marginVertical: spacing[3] },
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
