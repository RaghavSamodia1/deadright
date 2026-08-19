import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../tokens';
import { Avatar } from '../Avatar/Avatar';
import { Glass } from '../Glass/Glass';

interface ViolationRowProps {
  member: { handle: string; initials: string; avatarUri?: string };
  rule: string; // "Swearing"
  amount: string; // "+$1.00"
  timestamp: string; // "2h ago"
  /** Self-reported — gets the halo badge and softer styling */
  ownedUp?: boolean;
  /** Within the 24h dispute window */
  disputable?: boolean;
  style?: ViewStyle;
}

/** Swear Jar feed row. Own-ups get a 😇 badge — social reward for honesty. */
export function ViolationRow({ member, rule, amount, timestamp, ownedUp = false, disputable = false, style }: ViolationRowProps) {
  return (
    <View style={[styles.row, style]}>
      <Glass radius={radius.md} intensity={24} style={StyleSheet.absoluteFillObject} />
      <Avatar size="sm" initials={member.initials} uri={member.avatarUri} tint="b" />

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.handle}>{member.handle}</Text>
          {ownedUp && <Text style={styles.halo}>owned up</Text>}
        </View>
        <Text style={styles.meta}>
          {rule} · {timestamp}
          {disputable ? ' · disputable' : ''}
        </Text>
      </View>

      <Text style={styles.amount}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: 'transparent',
    borderRadius: radius.md,
    overflow: 'hidden',
    padding: spacing[4],
  },
  body: { flex: 1, gap: 2 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  handle: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 14,
    color: colors.text.primary,
  },
  halo: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: colors.semantic.win,
  },
  meta: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.text.tertiary,
  },
  amount: {
    fontFamily: 'Barlow-Bold',
    fontSize: 15,
    color: colors.semantic.awaiting,
  },
});
