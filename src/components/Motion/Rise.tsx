import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface RiseProps {
  /** Position in its list. Drives the stagger; pass the map index. */
  index?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

// Cards used to appear all at once, fully formed. A short stagger gives the eye
// an order to read them in, which matters most on Home where nine bento tiles
// land at the same moment.
const STEP = 45;
// Past about six the wait stops reading as choreography and starts reading as
// the app being slow, so later items ride in with the sixth.
const MAX_STEP = 6;
const TRAVEL = 10;

/**
 * Fade-and-rise entrance. Deliberately small: 10pt of travel and 260ms, so it
 * registers as the screen settling rather than as an animation being performed.
 */
export function Rise({ index = 0, children, style }: RiseProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(
      Math.min(index, MAX_STEP) * STEP,
      withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }),
    );
  }, [index, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * TRAVEL }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
