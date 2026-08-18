import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  Button,
  ListRow,
  BottomSheet,
  TextInput,
  ChoiceChip,
} from '../components';
import { getJarRules, proposeRule, settleJar } from '../api/jar';
import { useQuery, useAction } from '../hooks/useQuery';
import { useGroupCurrency } from '../hooks/useGroupCurrency';
import { formatMoney, DEFAULT_JAR_CAP_CENTS } from '../lib/money';
import { isBackendConfigured } from '../lib/supabase';
import { humanError } from '../lib/errors';

const MOCK_RULES = [
  { id: 'swear', emoji: '🤬', label: 'Swearing', amount_cents: 100 },
  { id: 'late', emoji: '⏰', label: 'Late to plans', amount_cents: 500 },
  { id: 'phone', emoji: '📱', label: 'Phone at dinner', amount_cents: 200 },
];

const EMOJIS = ['🤬', '⏰', '📱', '👻', '🍺', '💤', '🙄', '🧢'];
const AMOUNTS = [1, 2, 5, 10];

/** Rules belong to a group's jar — proposing one writes to that group. */
export function JarRulesScreen({ navigation, route }: any) {
  const groupId: string | undefined = route?.params?.groupId;
  const currency = useGroupCurrency(groupId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('🤬');
  const [amount, setAmount] = useState(1);

  const { data: rules, refetch } = useQuery(
    async () => (groupId ? await getJarRules(groupId) : MOCK_RULES),
    MOCK_RULES as any[],
    [groupId],
  );

  const { run: propose, loading, error } = useAction(proposeRule);
  const { run: settle, loading: settling } = useAction(settleJar);

  const addRule = async () => {
    if (!isBackendConfigured || !groupId) {
      setSheetOpen(false);
      return;
    }
    const created = await propose(groupId, label.trim(), amount * 100, emoji);
    if (created) {
      setSheetOpen(false);
      setLabel('');
      refetch();
    }
  };

  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title="Jar Rules" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        <Text style={styles.intro}>
          Break a rule, pay the jar. Anyone can propose a rule; group admins remove them.
          Amounts are ledger-only — like every bet.
        </Text>

        <View style={styles.list}>
          {rules.map((r: any) => (
            <ListRow
              key={r.id}
              left={
                <View style={styles.emojiBox}>
                  <Text style={styles.emoji}>{r.emoji ?? ''}</Text>
                </View>
              }
              title={r.label}
              subtitle="Anyone can report a break"
              value={formatMoney(r.amount_cents, currency)}
              valueColor={colors.semantic.awaiting}
              showChevron={false}
            />
          ))}
        </View>

        <Button label="+ PROPOSE A RULE" onPress={() => setSheetOpen(true)} variant="secondary" fullWidth />

        {groupId && (
          <Button
            label="Settle the jar"
            // Settling empties the pot for the whole group and writes ledger
            // entries — never do that on a single tap.
            onPress={() =>
              Alert.alert(
                'Settle the jar?',
                'This empties the pot for everyone and writes it to the group ledger. It can’t be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Settle it',
                    style: 'destructive',
                    onPress: async () => {
                      await settle(groupId, 'settled from rules screen');
                      navigation.goBack();
                    },
                  },
                ],
              )
            }
            loading={settling}
            variant="ghost"
            fullWidth
          />
        )}

        <Text style={styles.footnote}>
          {`Jar cap: ${formatMoney(DEFAULT_JAR_CAP_CENTS, currency)} · `}
          When full, the jar settles into a group event and everyone’s
          ledger updates proportionally.
        </Text>
      </ScrollView>

      <BottomSheet visible={sheetOpen} onDismiss={() => setSheetOpen(false)}>
        <Text style={styles.overline}>NEW RULE</Text>
        <TextInput
          label="What’s the offence?"
          placeholder="Swearing"
          value={label}
          onChangeText={setLabel}
          maxChars={40}
          error={error ? humanError(error) : undefined}
        />
        <Text style={styles.label}>Icon</Text>
        <View style={styles.chipWrap}>
          {EMOJIS.map((e) => (
            <ChoiceChip key={e} label={e} selected={emoji === e} onPress={() => setEmoji(e)} />
          ))}
        </View>
        <Text style={styles.label}>Cost</Text>
        <View style={styles.chipWrap}>
          {AMOUNTS.map((a) => (
            <ChoiceChip key={a} label={formatMoney(a * 100, currency)} selected={amount === a} onPress={() => setAmount(a)} />
          ))}
        </View>
        <Button
          label="Add rule"
          onPress={addRule}
          disabled={label.trim().length < 2}
          loading={loading}
          fullWidth
          style={styles.sheetCta}
        />
      </BottomSheet>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.screenGutter,
    gap: spacing[4],
    paddingBottom: spacing[8],
  },
  intro: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.secondary,
  },
  list: { gap: spacing[2] },
  emojiBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 20 },
  footnote: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 16,
    color: colors.text.tertiary,
  },
  overline: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
    marginBottom: spacing[3],
  },
  label: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.text.secondary,
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  sheetCta: { marginTop: spacing[4] },
});
