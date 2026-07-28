import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, useWindowDimensions } from 'react-native';
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

export interface TileDims {
  w: number;
  h: number;
  r: number;
}

/** Gap between tiles in a bento row/column — every screen uses spacing[3]. */
const GAP = spacing[3];
/** Design reference: 390pt iPhone minus two 20pt gutters (design-v2.md §3). */
const BASE_CONTENT = 390 - spacing.screenGutter * 2;

// Heights at the reference width. Widths are derived from the live screen
// width instead — see tileSizesFor(). Hero has no entry: its height is derived
// from stat so the two stack up to exactly one hero (226 == 107 * 2 + 12).
const BASE_HEIGHTS: Record<Exclude<TileSize, 'hero'>, number> = {
  wide: 150,
  stat: 107,
  nav: 84,
  chart: 120,
};

/**
 * How much a tile shrinks from the reference design, 0.75–1. Heights and the
 * big value type scale by this so a narrow hero doesn't truncate "$23.50".
 */
export function tileScaleFor(windowWidth: number): number {
  const content = Math.max(windowWidth - spacing.screenGutter * 2, 3 * GAP);
  return Math.min(1, Math.max(0.75, content / BASE_CONTENT));
}

/**
 * Bento grid dimensions for a given window width. Widths are fractions of the
 * content box so three nav tiles (or hero + stat) always fit exactly, instead
 * of the old fixed pixels that clipped below 390pt.
 */
export function tileSizesFor(windowWidth: number): Record<TileSize, TileDims> {
  const content = Math.max(windowWidth - spacing.screenGutter * 2, 3 * GAP);
  // Three small tiles + two gaps == one row; large == the remaining 2/3.
  const small = Math.floor((content - GAP * 2) / 3);
  const large = content - GAP - small;
  const scale = tileScaleFor(windowWidth);
  const statH = Math.round(BASE_HEIGHTS.stat * scale);

  return {
    // Two stacked stat tiles must line up with the hero beside them.
    hero: { w: large, h: statH * 2 + GAP, r: radius.lg },
    wide: { w: large, h: Math.round(BASE_HEIGHTS.wide * scale), r: radius.lg },
    stat: { w: small, h: statH, r: radius.md },
    nav: { w: small, h: Math.round(BASE_HEIGHTS.nav * scale), r: radius.md },
    chart: { w: large, h: Math.round(BASE_HEIGHTS.chart * scale), r: radius.md },
  };
}

/**
 * Live tile dimensions. Orientation is locked to portrait, but MainActivity
 * handles screenSize config changes itself, so this still has to recompute for
 * foldables and split-screen rather than relying on a restart.
 */
export function useTileSizes(): Record<TileSize, TileDims> {
  const { width } = useWindowDimensions();
  return React.useMemo(() => tileSizesFor(width), [width]);
}

/** Dimensions at the reference width, for layout maths outside a component. */
export const TILE_SIZES = tileSizesFor(390);

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
  const { width: windowWidth } = useWindowDimensions();
  const dims = React.useMemo(() => tileSizesFor(windowWidth)[size], [windowWidth, size]);
  const scale = tileScaleFor(windowWidth);
  const valueSize = Math.round(VALUE_SIZE[size] * scale);
  const t = TONES[tone];

  const handlePress = onPress
    ? () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }
    : undefined;

  const tileStyle: (ViewStyle | undefined)[] = [
    styles.tile,
    {
      width: dims.w,
      height: dims.h,
      padding: Math.round(spacing[4] * scale),
      borderRadius: dims.r,
      backgroundColor: t.bg,
      borderWidth: t.border ? 1 : 0,
      borderColor: t.border,
    },
    style,
  ];

  const a11yLabel = [label, value, caption].filter(Boolean).join(', ');

  const body = (
    <>
      {size === 'wide' && label && (
        <Text style={[styles.label, { color: t.sub }]}>{label}</Text>
      )}
      {emoji && <Text style={size === 'hero' ? styles.emojiLg : styles.emojiSm}>{emoji}</Text>}
      {value != null && VALUE_SIZE[size] > 0 && (
        <Text
          style={[
            styles.value,
            { color: t.text, fontSize: valueSize, lineHeight: valueSize * 1.08 },
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
    </>
  );

  // A function style is only honoured by Pressable — a plain View given one
  // silently renders unstyled, so the static branch must pass the array.
  if (!handlePress) {
    return (
      <View style={tileStyle} accessibilityLabel={a11yLabel}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [...tileStyle, { opacity: pressed ? 0.85 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
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
