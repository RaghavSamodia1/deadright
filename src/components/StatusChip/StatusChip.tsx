import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '../../tokens';

export type BetStatus =
  | 'active'
  | 'live'
  | 'awaiting'
  | 'win'
  | 'loss'
  | 'disputed'
  | 'controversial';

interface StatusChipProps {
  status: BetStatus;
  isCreator?: boolean;
  /**
   * Ink for a chip sitting on a coloured card fill. Each status's own hue
   * matches the fill it appears on by design ("card fill = card status"), so
   * the untinted chip is the same colour as its backdrop and disappears —
   * AWAITING on an amber card measured 1.00:1. See colors.cardInk.
   */
  ink?: { primary: string; chip: string };
  style?: ViewStyle;
}

const STATUS_CONFIG: Record<
  BetStatus,
  { label: string; bg: string; text: string; dot?: string }
> = {
  active: {
    label: 'ACTIVE',
    bg: colors.bg.surface2,
    text: colors.text.secondary,
  },
  live: {
    label: 'LIVE',
    bg: 'rgba(138,233,141,0.15)',
    text: colors.semantic.live,
    dot: colors.semantic.live,
  },
  awaiting: {
    label: 'AWAITING',
    bg: 'rgba(247,200,70,0.2)',
    text: colors.semantic.awaiting,
  },
  win: {
    label: 'YOU WON 🏆',
    bg: 'rgba(138,233,141,0.2)',
    text: colors.semantic.win,
  },
  loss: {
    label: 'YOU LOST',
    bg: colors.bg.surface2,
    text: colors.text.tertiary,
  },
  disputed: {
    label: 'DISPUTED ⚖️',
    bg: 'rgba(252,87,78,0.2)',
    text: colors.semantic.disputed,
  },
  controversial: {
    label: 'CONTROVERSIAL',
    bg: 'rgba(150,80,255,0.2)',
    text: colors.semantic.controversial,
  },
};

export function StatusChip({ status, isCreator = false, ink, style }: StatusChipProps) {
  const config = STATUS_CONFIG[status];
  const bg = ink?.chip ?? config.bg;
  const fg = ink?.primary ?? config.text;

  return (
    <View style={[styles.chip, { backgroundColor: bg }, style]}>
      {config.dot && (
        <View style={[styles.dot, { backgroundColor: ink?.primary ?? config.dot }]} />
      )}
      <Text style={[styles.label, { color: fg }]}>
        {isCreator && status === 'active' ? 'CREATOR' : config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
