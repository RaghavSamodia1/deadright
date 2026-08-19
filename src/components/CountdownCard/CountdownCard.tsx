import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../tokens';
import { Timer } from '../Timer/Timer';
import { Glass } from '../Glass/Glass';

interface CountdownCardProps {
  deadline: Date;
  /** Context line under the timer — "Until deadline · March 15, 11:59 PM" */
  caption: string;
  /** Bet title shown as overline context */
  title?: string;
  onExpire?: () => void;
  style?: ViewStyle;
}

/**
 * Departure-board style countdown (Sinport flight board aesthetic).
 * Full-width card with a huge Space Mono timer — glanceable from 2m away.
 */
export function CountdownCard({ deadline, caption, title, onExpire, style }: CountdownCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Glass radius={radius.lg} intensity={28} style={StyleSheet.absoluteFillObject} />
      <Text style={styles.overline}>TIME LEFT</Text>
      {title && (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      )}
      <Timer deadline={deadline} size="lg" onExpire={onExpire} />
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: spacing[7],
    alignItems: 'center',
    gap: spacing[2],
  },
  overline: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
  },
  title: {
    fontFamily: 'Barlow-Bold',
    fontSize: 17,
    color: colors.text.secondary,
  },
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.text.tertiary,
  },
});
