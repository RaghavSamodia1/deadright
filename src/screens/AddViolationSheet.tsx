import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius } from '../tokens';
import { BottomSheet, Avatar, Button, ChoiceChip } from '../components';

const MEMBERS = [
  { handle: '@marcus', initials: 'MJ' },
  { handle: '@abi', initials: 'AK' },
  { handle: '@dave', initials: 'DJ' },
  { handle: '@sam', initials: 'SB' },
];

const RULES = [
  { id: 'swear', label: 'Swearing', amount: 1 },
  { id: 'late', label: 'Late to plans', amount: 5 },
  { id: 'phone', label: 'Phone at dinner', amount: 2 },
  { id: 'flake', label: 'Flaking', amount: 10 },
];

interface AddViolationSheetProps {
  visible: boolean;
  onDismiss: () => void;
}

export function AddViolationSheet({ visible, onDismiss }: AddViolationSheetProps) {
  const [member, setMember] = useState<string | null>(null);
  const [rule, setRule] = useState<string | null>(null);
  const selectedRule = RULES.find((r) => r.id === rule);

  const submit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // TODO: insert violation; violator gets 24h dispute window notification
    onDismiss();
    setMember(null);
    setRule(null);
  };

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <Text style={styles.overline}>ADD VIOLATION</Text>

      <Text style={styles.label}>Who did it?</Text>
      <View style={styles.memberRow}>
        {MEMBERS.map((m) => (
          <Pressable
            key={m.handle}
            onPress={() => setMember(m.handle)}
            style={[styles.member, member === m.handle && styles.memberSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected: member === m.handle }}
          >
            <Avatar size="md" initials={m.initials} tint={member === m.handle ? 'b' : 'neutral'} />
            <Text style={[styles.memberHandle, member === m.handle && { color: colors.text.primary }]}>
              {m.handle}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Which rule?</Text>
      <View style={styles.ruleWrap}>
        {RULES.map((r) => (
          <ChoiceChip
            key={r.id}
            label={`${r.label} · $${r.amount}`}
            selected={rule === r.id}
            onPress={() => setRule(r.id)}
          />
        ))}
      </View>

      <Text style={styles.note}>
        {member && selectedRule
          ? `${member} can dispute within 24h. Fair's fair.`
          : 'They get 24h to dispute — same rules as bets.'}
      </Text>

      <Button
        label={selectedRule ? `INTO THE JAR — $${selectedRule.amount}` : 'INTO THE JAR'}
        onPress={submit}
        disabled={!member || !rule}
        fullWidth
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  overline: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
    marginBottom: spacing[4],
  },
  label: {
    fontFamily: 'Barlow-Bold',
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  memberRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  member: {
    alignItems: 'center',
    gap: 6,
    padding: spacing[2],
    borderRadius: radius.sm,
  },
  memberSelected: {
    backgroundColor: colors.bg.surface2,
  },
  memberHandle: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: colors.text.tertiary,
  },
  ruleWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  note: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: spacing[4],
  },
});
