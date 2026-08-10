import React, { useEffect, useRef, useState } from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

interface CountUpProps {
  value: number;
  /** Turns the tweened number into what's shown — "$4.00", "500", "62%". */
  format: (n: number) => string;
  duration?: number;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

/**
 * Counts a number up to its value on mount and on change.
 *
 * Driven from JS rather than by animating a TextInput through useAnimatedProps,
 * the usual reanimated trick for live text. That approach keeps the work off the
 * JS thread but drags TextInput's own metrics and padding in with it, and these
 * numbers are the largest type in the app — the jar total and the cred score sit
 * in bento tiles where a couple of points of drift is visible. One rAF loop for
 * about half a second, on a screen that isn't scrolling yet, is the cheaper
 * trade.
 */
export function CountUp({
  value,
  format,
  duration = 620,
  style,
  numberOfLines,
}: CountUpProps) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  const from = useRef(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }

    const start = Date.now();
    const origin = from.current;
    const delta = value - origin;

    // Nothing to travel: skip the loop rather than run it for one frame.
    if (delta === 0) {
      setShown(value);
      return;
    }

    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      // Ease out — the number decelerates into its final value instead of
      // stopping dead, which is what makes it read as counting.
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(origin + delta * eased);
      if (t < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        from.current = value;
      }
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      // Leave the origin where it stopped so an interrupted count resumes from
      // what's on screen rather than snapping back to zero.
      from.current = shown;
    };
  }, [value, reduced, duration]);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {format(shown)}
    </Text>
  );
}
