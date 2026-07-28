import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '../../tokens';

interface SkeletonBlockProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/** Single shimmering placeholder block. */
export function SkeletonBlock({ width, height, borderRadius = radius.xs, style }: SkeletonBlockProps) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.bg.surface3 },
        animatedStyle,
        style,
      ]}
    />
  );
}

/** Bet-card-shaped skeleton — prevents layout shift while the feed loads. */
export function SkeletonBetCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.authorRow}>
        <SkeletonBlock width={32} height={32} borderRadius={16} />
        <View style={styles.authorMeta}>
          <SkeletonBlock width={90} height={12} />
          <SkeletonBlock width={60} height={9} />
        </View>
        <SkeletonBlock width={56} height={20} borderRadius={radius.xs} />
      </View>
      <SkeletonBlock width="85%" height={16} />
      <SkeletonBlock width="100%" height={8} borderRadius={radius.full} />
      <View style={styles.footer}>
        <SkeletonBlock width={40} height={10} />
        <SkeletonBlock width={32} height={10} />
        <SkeletonBlock width={56} height={10} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    padding: spacing[4],
    gap: spacing[3],
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  authorMeta: {
    flex: 1,
    gap: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing[2],
  },
});
