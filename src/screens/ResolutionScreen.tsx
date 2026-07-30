import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, ChoiceChipGroup, TextInput, Banner, Button } from '../components';
import { proposeOutcome } from '../api/resolution';
import { useAction } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';

type Outcome = 'won' | 'lost' | 'push';
const OPTS: { value: Outcome; label: string }[] = [
  { value: 'won', label: '✅ I called it' },
  { value: 'lost', label: '❌ They did' },
  { value: 'push', label: '🤝 Push / draw' },
];

// Resolution — propose the outcome. Both sides must agree (agree_outcome RPC).
export function ResolutionScreen({ navigation, route }: any) {
  const title = route?.params?.title ?? 'Arsenal finish top 4 this season';
  const betId = route?.params?.id ?? route?.params?.betId;
  const [outcome, setOutcome] = useState<Outcome>('won');
  const [note, setNote] = useState('');
  const { run: propose, loading, error } = useAction(proposeOutcome);

  const submit = async () => {
    if (!isBackendConfigured || !betId) {
      return navigation.replace(outcome === 'won' ? 'Win' : 'Root', { betId });
    }
    // "I called it" = my side won. The RPC records the proposal; the other
    // side still has to agree before it resolves.
    const side = outcome === 'won' ? 'a' : 'b';
    const bet = await propose(betId, side, note || undefined);
    if (bet) navigation.replace(outcome === 'won' ? 'Win' : 'Root', { betId });
  };

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="back" title="Resolve" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.statement}>"{title}"</Text>

        <Banner
          tone="awaiting"
          title="Both sides confirm"
          body="Your proposal goes to the other side. If they disagree, it opens for a group vote."
        />

        <Text style={styles.q}>How did it land?</Text>
        <ChoiceChipGroup options={OPTS} value={outcome} onChange={setOutcome} />

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
        {error && <Text style={styles.error}>{error.message}</Text>}
        <Button label="Submit resolution" onPress={submit} loading={loading} fullWidth />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
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
