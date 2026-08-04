import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius } from '../tokens';
import { BottomSheet, Avatar, Button, ChoiceChip } from '../components';
import { getJarRules, addViolation } from '../api/jar';
import { getGroup } from '../api/groups';
import { useQuery, useAction } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';

const MOCK_MEMBERS = [
  { id: 'm1', handle: '@marcus', initials: 'MJ' },
  { id: 'm2', handle: '@abi', initials: 'AK' },
  { id: 'm3', handle: '@dave', initials: 'DJ' },
];

const MOCK_RULES = [
  { id: 'swear', label: 'Swearing', amount: 1 },
  { id: 'late', label: 'Late to plans', amount: 5 },
  { id: 'phone', label: 'Phone at dinner', amount: 2 },
];

interface AddViolationSheetProps {
  visible: boolean;
  onDismiss: () => void;
  /** The jar's group — rules and members are scoped to it. */
  groupId?: string;
}

export function AddViolationSheet({ visible, onDismiss, groupId }: AddViolationSheetProps) {
  const [member, setMember] = useState<string | null>(null);
  const [rule, setRule] = useState<string | null>(null);

  const { data: members } = useQuery(
    async () => {
      if (!groupId) return MOCK_MEMBERS;
      const g: any = await getGroup(groupId);
      return (g.members ?? []).map((m: any) => ({
        id: m.user_id,
        handle: m.profile?.handle ? `@${m.profile.handle}` : '@member',
        initials: (m.profile?.display_name ?? m.profile?.handle ?? '??')
          .slice(0, 2)
          .toUpperCase(),
      }));
    },
    MOCK_MEMBERS,
    [groupId],
  );

  const { data: rules } = useQuery(
    async () => {
      if (!groupId) return MOCK_RULES;
      return (await getJarRules(groupId)).map((r: any) => ({
        id: r.id,
        label: r.label,
        amount: r.amount_cents / 100,
      }));
    },
    MOCK_RULES,
    [groupId],
  );

  const { run: report, loading, error } = useAction(addViolation);
  const selectedRule = rules.find((r: any) => r.id === rule);

  const submit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (isBackendConfigured && groupId && member && rule) {
      // The violator gets a 24h dispute window (add_violation RPC).
      await report(groupId, rule, member);
    }
    onDismiss();
    setMember(null);
    setRule(null);
  };

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <Text style={styles.overline}>ADD VIOLATION</Text>

      <Text style={styles.label}>Who did it?</Text>
      <View style={styles.memberRow}>
        {members.map((m: any) => (
          <Pressable
            key={m.id}
            onPress={() => setMember(m.id)}
            style={[styles.member, member === m.id && styles.memberSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected: member === m.id }}
          >
            <Avatar size="md" initials={m.initials} tint={member === m.id ? 'b' : 'neutral'} />
            <Text style={[styles.memberHandle, member === m.id && { color: colors.text.primary }]}>
              {m.handle}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Which rule?</Text>
      {rules.length === 0 ? (
        <Text style={styles.note}>No rules yet — add one from the rules screen first.</Text>
      ) : (
        <View style={styles.ruleWrap}>
          {rules.map((r: any) => (
            <ChoiceChip
              key={r.id}
              label={`${r.label} · $${r.amount}`}
              selected={rule === r.id}
              onPress={() => setRule(r.id)}
            />
          ))}
        </View>
      )}

      <Text style={[styles.note, error ? { color: colors.interactive.destructive } : null]}>
        {error
          ? error.message
          : member && selectedRule
            ? 'They can dispute within 24h. Fair’s fair.'
            : 'They get 24h to dispute — same rules as bets.'}
      </Text>

      <Button
        label={selectedRule ? `INTO THE JAR — $${selectedRule.amount}` : 'INTO THE JAR'}
        onPress={submit}
        disabled={!member || !rule}
        loading={loading}
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
