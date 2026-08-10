import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withSpring,
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

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlers = {
    onPressIn: () => {
      if (!reduced) scale.value = withSpring(to, spring.fast);
    },
    onPressOut: () => {
      if (!reduced) scale.value = withSpring(1, spring.fast);
    },
  };

  return { style, handlers };
}
