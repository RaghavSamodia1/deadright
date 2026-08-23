import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../tokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface FormRingProps {
  /** 0–100 percentile fill */
  percent: number;
  /** Form score shown in centre */
  score?: number;
  size?: number;
  strokeWidth?: number;
  /** Optional avatar/children rendered inside the ring */
  children?: React.ReactNode;
  animated?: boolean;
}

export function FormRing({
  percent,
  score,
  size = 120,
  strokeWidth = 8,
  children,
  animated = true,
}: FormRingProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      progress.value = withTiming(percent / 100, {
        duration: 900,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progress.value = percent / 100;
    }
  }, [percent]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.form.track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.form.ring}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          // start at 12 o'clock
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.center}>
        {children ??
          (score !== undefined && (
            <Text style={[styles.score, { fontSize: size * 0.28 }]}>{score}</Text>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: {
    fontFamily: 'Barlow-Black',
    color: colors.form.ring,
    letterSpacing: -1,
  },
});
