import React, { useEffect } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { colors, spring } from '../../tokens';

interface StampProps {
  label: string;
  /** Text colour — usually navy on bright peak backgrounds */
  color?: string;
  /** Rotation in degrees; the classic rubber-stamp tilt */
  rotate?: number;
  fontSize?: number;
  /** Delay before the stamp slams in (ms) */
  delay?: number;
  style?: TextStyle;
}

/**
 * The "CALLED IT" celebration stamp. Barlow Black, tight tracking, diagonal
 * tilt, spring slam-in animation. Used on emotional peak screens.
 */
export function Stamp({
  label,
  color = colors.text.inverse,
  rotate = -12,
  fontSize = 56,
  delay = 0,
  style,
}: StampProps) {
  const scale = useSharedValue(2.4);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, spring.celebration));
    opacity.value = withDelay(delay, withSpring(1, spring.fast));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[
        styles.stamp,
        { color, fontSize, lineHeight: fontSize * 1.05 },
        animatedStyle,
        style,
      ]}
    >
      {label}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  stamp: {
    fontFamily: 'Barlow-Black',
    letterSpacing: -2,
    textAlign: 'center',
  },
});
