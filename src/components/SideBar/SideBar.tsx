import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, spring } from '../../tokens';

interface SideBarProps {
  sideAPercent: number; // 0–100
  sideACount?: number;
  sideBCount?: number;
  /** What the two sides are actually called. bets.side_a_label / side_b_label. */
  labelA?: string;
  labelB?: string;
  animated?: boolean;
  style?: ViewStyle;
}

/**
 * Who is on which side, as one bar.
 *
 * It used to be two rows: a line of labels reading "Side A 50% 0 people …
 * 0 people 50% Side B", and a thin track underneath. Every number appeared
 * twice, the two halves said the same thing in mirror image, and "Side A" told
 * you nothing about what anyone had actually called — while the database has
 * carried side_a_label and side_b_label, defaulting to YES and NO, since the
 * first migration. Nothing ever read them.
 *
 * Now the bar *is* the layout: the split shows the proportion, so the
 * percentages do not need printing, and the names sit inside the colour they
 * belong to. One row instead of two, and it reads like a scoreboard rather than
 * a form field.
 */
export function SideBar({
  sideAPercent,
  sideACount,
  sideBCount,
  labelA = 'YES',
  labelB = 'NO',
  animated = true,
  style,
}: SideBarProps) {
  /**
   * The bar's geometry is clamped, the numbers are not.
   *
   * A side with nobody on it is 0% wide, which leaves its name nowhere to go —
   * so each half keeps at least a quarter of the width to stand its label in.
   * The counts beside the labels stay exactly true, which is the part that
   * would be a lie if it were fudged.
   */
  const geom = Math.max(26, Math.min(74, sideAPercent));
  const aFlex = useSharedValue(geom / 100);

  useEffect(() => {
    aFlex.value = animated
      ? withSpring(geom / 100, spring.emphasis)
      : geom / 100;
  }, [geom, animated]);

  const aStyle = useAnimatedStyle(() => ({ flex: aFlex.value }));
  const bStyle = useAnimatedStyle(() => ({ flex: 1 - aFlex.value }));

  const hasCounts = sideACount !== undefined || sideBCount !== undefined;

  return (
    <View style={[styles.bar, style]}>
      <Animated.View style={[styles.half, styles.halfA, aStyle]}>
        <Text style={styles.label} numberOfLines={1}>
          {labelA.toUpperCase()}
        </Text>
        {hasCounts && <Text style={styles.count}>{sideACount ?? 0}</Text>}
      </Animated.View>

      <Animated.View style={[styles.half, styles.halfB, bStyle]}>
        {hasCounts && <Text style={styles.count}>{sideBCount ?? 0}</Text>}
        <Text style={styles.label} numberOfLines={1}>
          {labelB.toUpperCase()}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 34,
    borderRadius: 999,
    overflow: 'hidden',
    gap: 2,
  },
  half: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    minWidth: 0,
  },
  // Ink on both is the dark card ink: 12.5:1 on amber, 7.0:1 on teal.
  halfA: { backgroundColor: colors.side.a, justifyContent: 'flex-start', borderTopLeftRadius: 999, borderBottomLeftRadius: 999 },
  halfB: { backgroundColor: colors.side.b, justifyContent: 'flex-end', borderTopRightRadius: 999, borderBottomRightRadius: 999 },
  label: {
    fontFamily: 'Barlow-Black',
    fontSize: 12,
    letterSpacing: 0.6,
    color: colors.cardInk.onLight.primary,
    flexShrink: 1,
  },
  count: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 13,
    color: colors.cardInk.onLight.primary,
    opacity: 0.75,
  },
});
