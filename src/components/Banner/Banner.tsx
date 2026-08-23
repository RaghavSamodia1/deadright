import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../tokens';

export type BannerTone = 'awaiting' | 'dispute' | 'info' | 'invite';

interface BannerProps {
  tone?: BannerTone;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  style?: ViewStyle;
}

const TONES: Record<BannerTone, { bg: string; accent: string; text: string; sub: string }> = {
  awaiting: {
    bg: 'rgba(247,200,70,0.12)',
    accent: colors.semantic.awaiting,
    text: colors.text.primary,
    sub: colors.text.secondary,
  },
  dispute: {
    bg: 'rgba(252,87,78,0.12)',
    accent: colors.semantic.disputed,
    text: colors.text.primary,
    sub: colors.text.secondary,
  },
  info: {
    // Was opaque surface-2, which sat a solid block on top of the frosted panel
    // behind it. Translucent, so the banner tints the glass instead.
    bg: 'rgba(255,255,255,0.07)',
    accent: colors.semantic.awaiting,
    text: colors.text.primary,
    sub: colors.text.secondary,
  },
  invite: {
    bg: 'rgba(226,102,31,0.1)',
    accent: colors.brand.flame,
    text: colors.text.primary,
    sub: colors.text.secondary,
  },
};

/**
 * Pinned feed banner — "Needs resolution", "It's quiet in here — invite friends",
 * dispute alerts. Amber/coral tinted with accent border.
 */
export function Banner({ tone = 'info', title, body, actionLabel, onAction, onDismiss, style }: BannerProps) {
  const t = TONES[tone];

  return (
    <View style={[styles.banner, { backgroundColor: t.bg, borderColor: `${t.accent}55` }, style]}>
      {/* The decorative left stripe is gone. The tint, the border and the bar
          were three ways of saying one thing, and a coloured rule down the side
          of a notice is the most borrowed shape in the box. Tone still reads —
          it is carried by the fill and by the action colour. */}
      <View style={styles.body}>
        <Text style={[styles.title, { color: t.text }]}>{title}</Text>
        {body && <Text style={[styles.text, { color: t.sub }]}>{body}</Text>}
        {actionLabel && onAction && (
          <Pressable onPress={onAction} hitSlop={6}>
            <Text style={[styles.action, { color: t.accent }]}>{actionLabel}</Text>
          </Pressable>
        )}
      </View>
      {onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={8} accessibilityLabel="Dismiss banner">
          <Text style={styles.close}>×</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    padding: spacing[4],
    gap: spacing[3],
    alignItems: 'flex-start',
  },
  body: { flex: 1, gap: 4 },
  title: {
    fontFamily: 'Barlow-Bold',
    fontSize: 14,
  },
  text: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  action: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 13,
    marginTop: 2,
  },
  close: {
    fontFamily: 'Inter-Regular',
    fontSize: 20,
    color: colors.text.tertiary,
    lineHeight: 20,
  },
});
