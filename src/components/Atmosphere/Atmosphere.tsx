import React from 'react';
import { View, Image, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { GRAIN_URI } from './grain';

/**
 * The room the app sits in.
 *
 * Everything was dark grey cards on flat black, which reads as boxes on nothing.
 * Frosted glass would not have fixed that on its own — glass only looks like
 * glass when there is something behind it to catch. So: slow-drifting pools of
 * coloured light under the whole app, and a layer of grain over the top.
 *
 * The colours are the product's own semantics — flame, amber, teal, violet — at
 * low enough opacity to be atmosphere rather than decoration. You should never
 * catch it moving; you should only notice if it stopped.
 */

type Blob = {
  color: string;
  size: number;
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  seconds: number;
};

const BLOBS: Blob[] = [
  { color: '#E2661F', size: 1.25, x: -0.18, y: -0.06, driftX: 26, driftY: 34, seconds: 26 },
  { color: '#F7C846', size: 0.95, x: 0.72, y: 0.10, driftX: -32, driftY: 24, seconds: 31 },
  { color: '#4FA8A0', size: 1.05, x: 0.62, y: 0.62, driftX: 28, driftY: -30, seconds: 37 },
  { color: '#6C63FF', size: 0.85, x: -0.10, y: 0.74, driftX: -22, driftY: -26, seconds: 43 },
];

function Pool({ blob, index, reduced }: { blob: Blob; index: number; reduced: boolean }) {
  const { width, height } = useWindowDimensions();
  const d = Math.round(width * blob.size);
  const t = useSharedValue(0);

  React.useEffect(() => {
    if (reduced) return;
    // Each pool runs on its own prime-ish period so the set never visibly loops.
    t.value = withRepeat(
      withSequence(
        withTiming(1, { duration: blob.seconds * 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: blob.seconds * 1000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [reduced]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: t.value * blob.driftX },
      { translateY: t.value * blob.driftY },
      { scale: 1 + t.value * 0.08 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pool,
        { left: blob.x * width, top: blob.y * height, width: d, height: d },
        style,
      ]}
    >
      <Svg width={d} height={d}>
        <Defs>
          <RadialGradient id={`pool${index}`} cx="50%" cy="50%" r="50%">
            {/* Halved from 0.5/0.18. On an OLED phone the pools were reading
                as a colour cast laid over the whole app rather than as light in
                the room behind it — and they were fighting the glass, which
                needs something to refract but not something to compete with. */}
            <Stop offset="0" stopColor={blob.color} stopOpacity={0.25} />
            <Stop offset="0.45" stopColor={blob.color} stopOpacity={0.09} />
            <Stop offset="1" stopColor={blob.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={d / 2} cy={d / 2} r={d / 2} fill={`url(#pool${index})`} />
      </Svg>
    </Animated.View>
  );
}

export function Atmosphere() {
  const reduced = useReducedMotion();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {BLOBS.map((b, i) => (
        <Pool key={i} blob={b} index={i} reduced={reduced} />
      ))}
      <Image source={{ uri: GRAIN_URI }} resizeMode="repeat" style={styles.grain} />
    </View>
  );
}

const styles = StyleSheet.create({
  pool: { position: 'absolute' },
  grain: { ...StyleSheet.absoluteFillObject, opacity: 0.045 },
});
