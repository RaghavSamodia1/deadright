import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../tokens';
import { ScreenBackground, NavHeader, Button, ListRow } from '../components';

const RULES = [
  { id: 'swear', emoji: '🤬', label: 'Swearing', amount: '$1', count: 14 },
  { id: 'late', emoji: '⏰', label: 'Late to plans', amount: '$5', count: 4 },
  { id: 'phone', emoji: '📱', label: 'Phone at dinner', amount: '$2', count: 7 },
  { id: 'flake', emoji: '👻', label: 'Flaking', amount: '$10', count: 1 },
];

export function JarRulesScreen({ navigation }: any) {
  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title="Jar Rules" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Break a rule, pay the jar. Anyone can propose a rule; group admins remove them.
          Amounts are ledger-only — like every bet.
        </Text>

        <View style={styles.list}>
          {RULES.map((r) => (
            <ListRow
              key={r.id}
              left={
                <View style={styles.emojiBox}>
                  <Text style={styles.emoji}>{r.emoji}</Text>
                </View>
              }
              title={r.label}
              subtitle={`${r.count} violations all-time`}
              value={r.amount}
              valueColor={colors.semantic.awaiting}
              showChevron={false}
            />
          ))}
        </View>

        <Button label="+ PROPOSE A RULE" onPress={() => {}} variant="secondary" fullWidth />

        <Text style={styles.footnote}>
          Jar cap: $50 · When full, the jar settles into a group event and everyone's
          ledger updates proportionally.
        </Text>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.screenGutter,
    gap: spacing[4],
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
});
