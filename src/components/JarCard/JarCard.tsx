import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../tokens';

interface JarCardProps {
  /** Formatted total — "$23.50" */
  total: string;
  groupName: string;
  contributionCount: number;
  /** 0–1 toward the jar cap; bar hidden when undefined */
  capProgress?: number;
  capLabel?: string; // "Cap: $50 — settle-up at full"
  style?: ViewStyle;
}

/**
 * Cookie Jar hero — bag-drop style amber card. The jar total is the loudest
 * thing on the screen; hitting the cap forces a group settle-up.
 */
export function JarCard({ total, groupName, contributionCount, capProgress, capLabel, style }: JarCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.topRow}>
        <Text style={styles.emoji}>🍪</Text>
        <View style={styles.groupChip}>
          <Text style={styles.groupLabel}>{groupName.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.total}>{total}</Text>
      <Text style={styles.sub}>
        IN THE JAR · {contributionCount} {contributionCount === 1 ? 'VIOLATION' : 'VIOLATIONS'}
      </Text>

      {capProgress !== undefined && (
        <View style={styles.capWrap}>
          <View style={styles.capTrack}>
            <View style={[styles.capFill, { width: `${Math.min(capProgress, 1) * 100}%` }]} />
          </View>
          {capLabel && <Text style={styles.capLabel}>{capLabel}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card.amber,
    borderRadius: radius.lg,
    padding: spacing[6],
    gap: 4,
    // Hero card: centre the stack so the total reads as the headline object
    // rather than sitting left-heavy against a wide amber field.
    alignItems: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[2],
    alignSelf: 'stretch',
  },
  emoji: { fontSize: 36 },
  groupChip: {
    backgroundColor: 'rgba(10,10,11,0.15)',
    borderRadius: radius.xs,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  groupLabel: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 10,
    letterSpacing: 1,
    color: colors.text.inverse,
  },
  total: {
    fontFamily: 'Barlow-Black',
    textAlign: 'center',
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -2,
    color: colors.text.inverse,
    includeFontPadding: false,
  },
  sub: {
    fontFamily: 'Barlow-SemiBold',
    textAlign: 'center',
    fontSize: 12,
    letterSpacing: 1,
    color: 'rgba(10,10,11,0.6)',
  },
  capWrap: {
    marginTop: spacing[3],
    gap: 6,
  },
  capTrack: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(10,10,11,0.15)',
    overflow: 'hidden',
  },
  capFill: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.text.inverse,
  },
  capLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: 'rgba(10,10,11,0.6)',
  },
});
