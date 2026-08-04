import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../tokens';
import { Button } from '../Button/Button';
import { Icon, type IconName } from '../Icon/Icon';

interface EmptyStateProps {
  /** Drawn icon rather than an emoji — see components/Icon. */
  icon: IconName;
  /** Accent colour for the illustration halo */
  tint?: string;
  title: string;
  body: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  tint = colors.brand.flame,
  title,
  body,
  ctaLabel,
  onCtaPress,
  secondaryLabel,
  onSecondaryPress,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.halo, { backgroundColor: hexWithAlpha(tint, 0.12) }]}>
        <Icon name={icon} size={40} color={colors.text.tertiary} strokeWidth={1.6} />
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>

      {ctaLabel && onCtaPress && (
        <Button label={ctaLabel} onPress={onCtaPress} variant="primary" size="lg" />
      )}

      {secondaryLabel && onSecondaryPress && (
        <Text style={styles.secondary} onPress={onSecondaryPress}>
          {secondaryLabel}
        </Text>
      )}
    </View>
  );
}

// Accepts #RRGGBB, returns rgba() with alpha
function hexWithAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing[5],
    paddingHorizontal: spacing[7],
    paddingVertical: spacing[8],
  },
  halo: {
    width: 96,
    height: 96,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textBlock: {
    alignItems: 'center',
    gap: spacing[2],
  },
  title: {
    fontFamily: 'Barlow-Bold',
    fontSize: 22,
    lineHeight: 28,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  secondary: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.text.link,
  },
});
