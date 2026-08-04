import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, TextInput, Button } from '../components';
import { createPool } from '../api/pools';
import { useAction } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';
import { humanError } from '../lib/errors';

const MAX_OPTIONS = 6;

/**
 * Party Pool creation. A pool is deliberately lighter than a bet: no sides, no
 * stake, no resolution machinery — just a question, some options, and a link
 * anyone at the party can open without installing anything.
 */
export function CreatePoolScreen({ navigation, route }: any) {
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const { run: create, loading, error } = useAction(createPool);

  const filled = options.filter((o) => o.trim().length > 0);
  const ready = title.trim().length > 1 && question.trim().length > 3 && filled.length >= 2;

  const setOption = (i: number, value: string) =>
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));

  const submit = async () => {
    if (!isBackendConfigured) return navigation.replace('PoolDetail', { demo: true });
    const pool = await create({
      title: title.trim(),
      question: question.trim(),
      options: filled,
      groupId: route?.params?.groupId ?? null,
    });
    if (pool) navigation.replace('PoolDetail', { id: pool.id, justCreated: true });
  };

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="modal" title="New party pool" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.blurb}>
          Everyone at the party picks from their phone — no app, no signup. You just share a link.
        </Text>

        <TextInput
          label="Pool name"
          placeholder="Diwali party 2026"
          value={title}
          onChangeText={setTitle}
          maxChars={60}
        />
        <TextInput
          label="The question"
          placeholder="Who's getting engaged first?"
          value={question}
          onChangeText={setQuestion}
          multiline
          maxChars={140}
          showCounter
        />

        <Text style={styles.label}>OPTIONS</Text>
        {options.map((o, i) => (
          <TextInput
            key={i}
            placeholder={`Option ${i + 1}`}
            value={o}
            onChangeText={(v) => setOption(i, v)}
            maxChars={60}
          />
        ))}

        {options.length < MAX_OPTIONS && (
          <Pressable onPress={() => setOptions((p) => [...p, ''])} style={styles.addRow}>
            <Text style={styles.addText}>+ Add another option</Text>
          </Pressable>
        )}

        {error && <Text style={styles.error}>{humanError(error)}</Text>}

        <Button
          label="Create pool & get link"
          onPress={submit}
          disabled={!ready}
          loading={loading}
          fullWidth
          style={styles.cta}
        />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[4], paddingBottom: spacing[8] },
  blurb: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 21,
    color: colors.text.secondary,
  },
  label: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
    marginTop: spacing[2],
  },
  addRow: { paddingVertical: spacing[2] },
  addText: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 14,
    color: colors.text.link,
  },
  error: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.interactive.destructive,
  },
  cta: { marginTop: spacing[2] },
});
