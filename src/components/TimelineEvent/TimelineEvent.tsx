import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../../tokens';

export type TimelineTone = 'default' | 'side-a' | 'side-b' | 'win' | 'dispute' | 'awaiting';

interface TimelineEventProps {
  /** "@abi joined Side A" — supports the 👀 side-switch events */
  text: string;
  timestamp: string;
  tone?: TimelineTone;
  /** Last event hides the connector line */
  isLast?: boolean;
  style?: ViewStyle;
}

const TONE_DOT: Record<TimelineTone, string> = {
  default: colors.text.tertiary,
  'side-a': colors.side.a,
  'side-b': colors.side.b,
  win: colors.semantic.win,
  dispute: colors.semantic.disputed,
  awaiting: colors.semantic.awaiting,
};

/** Bet Detail timeline row: dot + connector line + event text. */
export function TimelineEvent({ text, timestamp, tone = 'default', isLast = false, style }: TimelineEventProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.rail}>
        <View style={[styles.dot, { backgroundColor: TONE_DOT[tone] }]} />
        {!isLast && <View style={styles.line} />}
      </View>
      <View style={styles.body}>
        <Text style={styles.text}>{text}</Text>
        <Text style={styles.time}>{timestamp}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  rail: {
    alignItems: 'center',
    width: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  line: {
    flex: 1,
    width: 1.5,
    backgroundColor: colors.border.default,
    marginTop: 4,
  },
  body: {
    flex: 1,
    paddingBottom: spacing[5],
    gap: 2,
  },
  text: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.primary,
  },
  time: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.text.tertiary,
  },
});
