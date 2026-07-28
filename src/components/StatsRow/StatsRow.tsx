import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../../tokens';

export interface Stat {
  value: string;
  label: string;
  /** Highlight this stat (amber) — used for Cred */
  highlight?: boolean;
}

interface StatsRowProps {
  stats: Stat[];
  style?: ViewStyle;
}

/** Profile stats strip: value-over-label columns with dividers. */
export function StatsRow({ stats, style }: StatsRowProps) {
  return (
    <View style={[styles.row, style]}>
      {stats.map((s, i) => (
        <React.Fragment key={s.label}>
          {i > 0 && <View style={styles.divider} />}
          <View style={styles.stat}>
            <Text style={[styles.value, s.highlight && { color: colors.semantic.awaiting }]}>
              {s.value}
            </Text>
            <Text style={styles.label}>{s.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  value: {
    fontFamily: 'Barlow-Bold',
    fontSize: 18,
    color: colors.text.primary,
  },
  label: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.text.tertiary,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border.default,
  },
});
