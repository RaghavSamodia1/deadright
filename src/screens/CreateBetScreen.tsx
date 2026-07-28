import React, { useState } from 'react';
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
type Stake = 'brag' | 'coffee' | 'beer' | 'money';
const STAKE_OPTS: { value: Stake; label: string }[] = [
  { value: 'brag', label: '🏆 Bragging rights' },
  { value: 'coffee', label: '☕ Coffee' },
  { value: 'beer', label: '🍺 Round' },
  { value: 'money', label: '💷 A tenner' },
];

const STEPS = ['Statement', 'Type', 'Deadline', 'Stake', 'Group', 'Review'];

export function CreateBetScreen({ navigation }: any) {
  const [step, setStep] = useState(0);
  const [statement, setStatement] = useState('');
  const [sharpened, setSharpened] = useState<string | null>(null);
  const [type, setType] = useState<BetType>('binary');
  const [deadline, setDeadline] = useState<Deadline>('24h');
  const [stake, setStake] = useState<Stake>('brag');
  const [group, setGroup] = useState<string>('g1');

  const groups = [
    { id: 'g1', emoji: '⚽', name: 'Sunday League', memberCount: 8, members: [{ initials: 'MC' }, { initials: 'PR' }, { initials: 'DJ' }] },
    { id: 'g2', emoji: '🏠', name: 'Flatmates', memberCount: 5, members: [{ initials: 'AB' }, { initials: 'JK' }] },
  ];

  const canNext = step === 0 ? statement.trim().length > 4 : true;
  const preview: BetCardData = {
    id: 'preview',
    title: sharpened || statement || 'Your call goes here…',
    status: 'awaiting',
    author: { handle: '@you', initials: 'RS' },
    group: groups.find((g) => g.id === group)?.name,
    sideAPercent: 50, sideACount: 0, sideBCount: 0, participantCount: 1,
    stake: STAKE_OPTS.find((s) => s.value === stake)?.label.split(' ')[0],
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24),
  };

  const next = () => (step === STEPS.length - 1 ? navigation.replace('BetPlaced') : setStep(step + 1));
  const back = () => (step === 0 ? navigation.goBack() : setStep(step - 1));

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="modal" title={STEPS[step]} onBack={() => navigation.goBack()} />
      <ProgressDots total={STEPS.length} current={step} style={styles.dots} />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <>
            <Text style={styles.q}>What are you calling?</Text>
            <TextInput
              placeholder="e.g. Arsenal finish top 4 this season"
              value={statement}
              onChangeText={(t) => { setStatement(t); setSharpened(null); }}
              multiline
              maxChars={140}
              showCounter
              autoFocus
            />
            {statement.trim().length > 8 && !sharpened && (
              <SuggestionCard
                suggestion={`${statement.trim().replace(/\.$/, '')} — resolved by the final Premier League table.`}
                onAccept={() => setSharpened(`${statement.trim().replace(/\.$/, '')} — resolved by the final Premier League table.`)}
                onReject={() => setSharpened('')}
              />
            )}
          </>
        )}

        {step === 1 && (
          <>
            <Text style={styles.q}>How is it settled?</Text>
            <ChoiceChipGroup options={TYPE_OPTS} value={type} onChange={setType} />
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
          </>
        )}

        {step === 4 && (
          <>
            <Text style={styles.q}>Who’s in?</Text>
            {groups.map((g) => (
              <GroupCard key={g.id} {...g} selected={group === g.id} onPress={() => setGroup(g.id)} />
            ))}
          </>
        )}

        {step === 5 && (
          <>
            <Text style={styles.q}>Lock it in?</Text>
            <BetCard bet={preview} onPress={() => {}} />
            <Text style={styles.hint}>Once you publish, the clock starts and everyone gets pinged.</Text>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button label={step === 0 ? 'Cancel' : 'Back'} onPress={back} variant="ghost" />
        <Button
          label={step === STEPS.length - 1 ? 'Call it 🔥' : 'Next'}
          onPress={next}
          disabled={!canNext}
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
