import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, ChoiceChipGroup, TextInput, Banner, Button } from '../components';

type Outcome = 'won' | 'lost' | 'push';
const OPTS: { value: Outcome; label: string }[] = [
  { value: 'won', label: '✅ I called it' },
  { value: 'lost', label: '❌ They did' },
  { value: 'push', label: '🤝 Push / draw' },
];

// Resolution — propose the outcome. Both sides must agree (agree_outcome RPC).
export function ResolutionScreen({ navigation, route }: any) {
  const title = route?.params?.title ?? 'Arsenal finish top 4 this season';
  const [outcome, setOutcome] = useState<Outcome>('won');
  const [note, setNote] = useState('');

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
          onPress={() => navigation.navigate('EvidenceUpload', { title, outcome })}
          variant="secondary"
          fullWidth
        />
        <Button
          label="Submit resolution"
          onPress={() => navigation.replace(outcome === 'won' ? 'Win' : 'Root')}
          fullWidth
        />
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
});
