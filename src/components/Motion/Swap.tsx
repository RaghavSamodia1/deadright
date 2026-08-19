import React, { useEffect, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  runOnJS,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface SwapProps {
  /** false shows `a`, true shows `b`. */
  showing: boolean;
  a: React.ReactNode;
  b: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const OUT = 150;
const IN = 240;

/**
 * Hands one face off to another.
 *
 * The outgoing face drops a little and dims — it is being put down, not wiped —
 * and the incoming one comes up to meet you. The character is deliberately in
 * what happens *after* the swap rather than in the swap itself: whatever mounts
 * deals its own contents in, so the bento re-staggers its rows and the
 * soundboard lands pad by pad. One 150ms handover reads as picking a thing up;
 * the pieces arriving one at a time is what reads as assembly.
 */
export function Swap({ showing, a, b, style }: SwapProps) {
  const reduced = useReducedMotion();
  const [face, setFace] = useState(showing);
  const fade = useSharedValue(1);

  useEffect(() => {
    if (face === showing) return;
    if (reduced) {
      setFace(showing);
      return;
    }
    fade.value = withTiming(0, { duration: OUT, easing: Easing.in(Easing.quad) }, (done) => {
      // Swapping in the callback rather than on a timer keeps the content
      // change pinned to the frame the face actually reaches zero.
      if (done) runOnJS(setFace)(showing);
    });
  }, [showing, face, reduced]);

  useEffect(() => {
    if (reduced) {
      fade.value = 1;
      return;
    }
    fade.value = withTiming(1, { duration: IN, easing: Easing.out(Easing.cubic) });
  }, [face, reduced]);

  const style2d = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      { scale: 0.965 + fade.value * 0.035 },
      { translateY: (1 - fade.value) * 12 },
    ],
  }));

  return <Animated.View style={[style, style2d]}>{face ? b : a}</Animated.View>;
}
