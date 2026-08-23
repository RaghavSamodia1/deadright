import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../tokens';

export type StatCardTone = 'navy' | 'amber' | 'mint' | 'coral' ;

interface StatCardProps {
  /** The big number — "847", "75%", "5×" */
  value: string;
  label: string;
  /** Small caption under the label — "Top 22% · Rising" */
  caption?: string;
  /** Sinport bag-drop style: bold solid fill communicates meaning */
  tone?: StatCardTone;
  /** Compact = inline stat row, large = hero card */
  size?: 'lg' | 'sm';
  style?: ViewStyle;
}

const TONES: Record<StatCardTone, { bg: string; text: string; sub: string }> = {
  navy: { bg: colors.bg.surface1, text: colors.text.primary, sub: colors.text.tertiary },
  amber: { bg: colors.card.amber, text: colors.text.inverse, sub: 'rgba(10,10,11,0.6)' },
  mint: { bg: colors.card.mint, text: colors.text.inverse, sub: 'rgba(10,10,11,0.6)' },
  coral: { bg: colors.card.coral, text: colors.text.primary, sub: 'rgba(240,240,240,0.65)' },
};

/**
 * Sinport bag-drop-style stat card: huge Barlow Black number on a bold fill.
 * Used for Form Score, win rate, streaks, pot totals.
 */
export function StatCard({ value, label, caption, tone = 'navy', size = 'lg', style }: StatCardProps) {
  const t = TONES[tone];
  const isLg = size === 'lg';
  // Same rule as the bento: neutral surfaces frost, coloured ones stay solid.
  // A frosted amber card is a washed-out amber card.
  const r = isLg ? radius.lg : radius.md;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: t.bg,
          borderWidth: tone === 'navy' ? 1 : 0,
          borderColor: colors.border.default,
          borderRadius: r,
          padding: isLg ? spacing[6] : spacing[4],
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.value,
          { color: t.text, fontSize: isLg ? 56 : 28, lineHeight: isLg ? 60 : 32 },
        ]}
      >
        {value}
      </Text>
      <Text style={[styles.label, { color: t.text, fontSize: isLg ? 15 : 12 }]}>{label}</Text>
      {caption && <Text style={[styles.caption, { color: t.sub }]}>{caption}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 4,
    alignSelf: 'flex-start',
  },
  value: {
    fontFamily: 'Barlow-Black',
    letterSpacing: -2,
    includeFontPadding: false,
  },
  label: {
    fontFamily: 'Barlow-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 15,
  },
});
