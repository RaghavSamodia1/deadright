import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { spring } from '../../tokens';

export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * The dip a control takes under a finger.
 *
 * BetCard already did this by hand through Pressable's `pressed` flag, which
 * snaps between two values on separate renders — the release in particular just
 * pops back. A spring settles instead, and the touch handlers are the same two
 * props everywhere, so tiles and buttons share one feel.
 */
export function usePressScale(to = 0.97) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const lit = useSharedValue(0);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  /**
   * A separate overlay opacity, so a surface can catch light under the finger
   * as well as give. In a room lit from behind, a panel that only shrinks reads
   * as flat; one that brightens reads as being touched.
   *
   * Kept under reduced motion — it is a state change, not movement, and losing
   * it would leave those users with no press feedback at all.
   */
  const glow = useAnimatedStyle(() => ({ opacity: lit.value }));

  const handlers = {
    onPressIn: () => {
      if (!reduced) scale.value = withSpring(to, spring.fast);
      lit.value = withTiming(1, { duration: 90 });
    },
    onPressOut: () => {
      if (!reduced) scale.value = withSpring(1, spring.fast);
      lit.value = withTiming(0, { duration: 220 });
    },
  };

  return { style, glow, handlers };
}
