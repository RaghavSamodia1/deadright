import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, spring } from '../../tokens';

interface ProgressDotsProps {
  total: number;
  current: number; // 0-indexed
  /** Colour of the active dot; defaults to amber */
  activeColor?: string;
  /** Colour of inactive dots */
  inactiveColor?: string;
  style?: ViewStyle;
}

export function ProgressDots({
  total,
  current,
  activeColor = colors.interactive.primary,
  inactiveColor = colors.bg.surface3,
  style,
}: ProgressDotsProps) {
  return (
    <View style={[styles.row, style]}>
      {Array.from({ length: total }).map((_, i) => (
        <Dot
          key={i}
          active={i === current}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
        />
      ))}
    </View>
  );
}

function Dot({
  active,
  activeColor,
  inactiveColor,
}: {
  active: boolean;
  activeColor: string;
  inactiveColor: string;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withSpring(active ? 16 : 6, spring.fast),
    backgroundColor: active ? activeColor : inactiveColor,
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
