import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '../../tokens';

export type TileSize = 'hero' | 'wide' | 'stat' | 'nav' | 'chart';
export type TileTone =
  | 'amber' | 'mint' | 'flame' | 'navy'
  | 'amber-tint' | 'mint-tint' | 'violet-tint';

interface BentoTileProps {
  size?: TileSize;
  tone?: TileTone;
  /** Big number/glyph — "$23.50", "847", "+" */
  value?: string;
  /** Overline label — "COOKIE JAR", "LEDGER →" */
  label?: string;
  /** Small caption under value — "Open the jar →" */
  caption?: string;
  emoji?: string;
  onPress?: () => void;
  /** Free-form children (charts, progress bars) rendered below value */
  children?: React.ReactNode;
  style?: ViewStyle;
}

// Bento grid dimensions (design-v2.md §3): 350 content width, 12px gaps
export const TILE_SIZES: Record<TileSize, { w: number; h: number; r: number }> = {
  hero: { w: 226, h: 226, r: radius.lg },
  wide: { w: 226, h: 150, r: radius.lg },
  stat: { w: 112, h: 107, r: radius.md },
  nav: { w: 112, h: 84, r: radius.md },
  chart: { w: 226, h: 120, r: radius.md },
};

const TONES: Record<TileTone, { bg: string; border?: string; text: string; sub: string }> = {
  amber: { bg: colors.card.amber, text: colors.text.inverse, sub: 'rgba(14,18,26,0.6)' },
  mint: { bg: colors.card.mint, text: colors.text.inverse, sub: 'rgba(14,18,26,0.6)' },
  flame: { bg: colors.brand.flame, text: colors.text.primary, sub: 'rgba(240,240,240,0.7)' },
  navy: { bg: colors.bg.surface1, border: colors.border.default, text: colors.text.primary, sub: colors.text.tertiary },
  'amber-tint': { bg: 'rgba(247,200,70,0.12)', border: 'rgba(247,200,70,0.4)', text: colors.semantic.awaiting, sub: colors.text.tertiary },
  'mint-tint': { bg: 'rgba(138,233,141,0.12)', border: 'rgba(138,233,141,0.4)', text: colors.semantic.win, sub: colors.text.tertiary },
  'violet-tint': { bg: 'rgba(108,99,255,0.15)', border: 'rgba(108,99,255,0.4)', text: colors.side.a, sub: colors.text.secondary },
};

const VALUE_SIZE: Record<TileSize, number> = { hero: 52, wide: 48, stat: 28, nav: 22, chart: 0 };

/**
 * v2 bento vocabulary (design-v2.md). Tiles that navigate should pass onPress
 * and include a "→" in label or caption — visible affordance, per H6.
 */
export function BentoTile({
  size = 'stat',
  tone = 'navy',
  value,
  label,
  caption,
  emoji,
  onPress,
  children,
  style,
}: BentoTileProps) {
  const dims = TILE_SIZES[size];
  const t = TONES[tone];

  const handlePress = onPress
    ? () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }
    : undefined;

  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={handlePress}
      style={({ pressed }: { pressed?: boolean } = {}) => [
        styles.tile,
        {
          width: dims.w,
          height: dims.h,
          borderRadius: dims.r,
          backgroundColor: t.bg,
          borderWidth: t.border ? 1 : 0,
          borderColor: t.border,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[label, value, caption].filter(Boolean).join(', ')}
    >
      {size === 'wide' && label && (
        <Text style={[styles.label, { color: t.sub }]}>{label}</Text>
      )}
      {emoji && <Text style={size === 'hero' ? styles.emojiLg : styles.emojiSm}>{emoji}</Text>}
      {value != null && VALUE_SIZE[size] > 0 && (
        <Text
          style={[
            styles.value,
            { color: t.text, fontSize: VALUE_SIZE[size], lineHeight: VALUE_SIZE[size] * 1.08 },
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
      )}
      {size !== 'wide' && label && (
        <Text style={[styles.label, { color: tone === 'navy' ? colors.text.tertiary : t.sub }]}>
          {label}
        </Text>
      )}
      {children}
      {caption && <Text style={[styles.caption, { color: t.sub }]}>{caption}</Text>}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  tile: {
    padding: spacing[4],
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  emojiLg: { fontSize: 40, marginBottom: spacing[2] },
  emojiSm: { fontSize: 24, marginBottom: spacing[1] },
  value: {
    fontFamily: 'Barlow-Black',
    letterSpacing: -1.5,
    includeFontPadding: false,
  },
  label: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 9,
    letterSpacing: 1,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    marginTop: 'auto' as unknown as number,
  },
});
