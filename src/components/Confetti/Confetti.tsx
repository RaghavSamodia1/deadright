import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

/**
 * The burst for the moment somebody is proved right.
 *
 * Hand-rolled rather than a library: a confetti dependency is a lot of surface
 * area for one screen, and doing it here means the pieces are the product's own
 * colours and land on the product's own timing.
 *
 * Each piece gets its own angle, distance, spin and drop, so nothing about the
 * burst repeats. They fall past the bottom rather than fading on the spot —
 * confetti that dissolves in mid-air reads as a glitch.
 */
const COLORS = ['#F7C846', '#E2661F', '#63B972', '#4FA8A0', '#E8B33C', '#F2F2F4'];

function Piece({ index, total }: { index: number; total: number }) {
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);

  // Fan the pieces across an upward arc rather than firing them all straight up.
  const angle = (-Math.PI / 2) + ((index / total) - 0.5) * 2.2 + (Math.random() - 0.5) * 0.35;
  const speed = 220 + Math.random() * 300;
  const dx = Math.cos(angle) * speed;
  const rise = Math.sin(angle) * speed;
  const spin = (Math.random() - 0.5) * 1080;
  const w = 6 + Math.random() * 6;
  const h = 9 + Math.random() * 10;
  const color = COLORS[index % COLORS.length];
  const delay = Math.random() * 140;
  const life = 1500 + Math.random() * 900;

  React.useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration: life, easing: Easing.out(Easing.quad) }));
  }, []);

  const style = useAnimatedStyle(() => {
    const p = t.value;
    // Up on the launch, then gravity takes over — the arc is the whole point.
    const y = rise * p + height * 1.15 * p * p;
    return {
      opacity: p > 0.88 ? (1 - p) / 0.12 : 1,
      transform: [
        { translateX: dx * p },
        { translateY: y },
        { rotate: `${spin * p}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        { width: w, height: h, backgroundColor: color, left: width / 2, top: height * 0.42 },
        style,
      ]}
    />
  );
}

export function Confetti({ count = 46 }: { count?: number }) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: count }, (_, i) => (
        <Piece key={i} index={i} total={count} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', borderRadius: 1.5 },
});
