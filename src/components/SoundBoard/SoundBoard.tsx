import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { spacing } from '../../tokens';
import { Glass } from '../Glass/Glass';
import { useTileSizes, tileScaleFor, type TileSize } from '../BentoTile/BentoTile';
import { useWindowDimensions } from 'react-native';
import { PADS, type Pad } from './sounds';
import { useSoundBoard } from './useSoundBoard';

/**
 * The bento, as an instrument.
 *
 * It deliberately reuses the grid's own dimensions rather than laying out a
 * neat 3×4 of squares: the joke only lands if it is unmistakably *this* bento
 * with the tiles repurposed, so the hero tile is the airhorn and the little
 * corner tile is the crickets. It also means the flip has nothing to resize —
 * both faces are exactly the same shape.
 */

const LABEL_SIZE: Record<TileSize, number> = {
  hero: 34, feature: 24, wide: 24, chart: 20,
  band: 20, half: 18, stat: 14, nav: 13,
};

const IMPACT = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
} as const;

function PadButton({ pad, index, onHit }: { pad: Pad; index: number; onHit: (key: string) => void }) {
  const { width } = useWindowDimensions();
  const dims = useTileSizes()[pad.size];
  const scale = tileScaleFor(width);
  const reduced = useReducedMotion();

  const press = useSharedValue(1);
  const flash = useSharedValue(0);

  // Dealt, not revealed. Each pad arrives a beat after the one before it, from
  // below and slightly crooked, and straightens as it settles — the board
  // assembling itself rather than appearing whole. The tilt alternates so the
  // stack looks thrown down rather than machine-fed.
  const deal = useSharedValue(reduced ? 1 : 0);
  const tilt = (index % 2 === 0 ? -1 : 1) * (2.5 + (index % 3));

  React.useEffect(() => {
    if (reduced) return;
    deal.value = withDelay(
      index * 45,
      withSpring(1, { damping: 14, stiffness: 190, mass: 0.7 }),
    );
  }, []);
  // 1 is 'done', which is also the resting state — starting at 0 left the
  // ripple parked at full opacity and 15% scale on every untouched pad.
  const ring = useSharedValue(1);

  // Screen readers fire onPress without onPressIn, so the pad has to accept
  // either — but a finger produces both, and would otherwise play twice.
  const viaTouch = React.useRef(false);

  const hit = () => {
    Haptics.impactAsync(IMPACT[pad.weight]);
    onHit(pad.key);

    // The flash is an opacity change, not movement, so it survives Reduce
    // Motion — without it those users would tap a pad and see nothing at all.
    flash.value = withSequence(
      withTiming(1, { duration: 40 }),
      withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) }),
    );
    if (reduced) return;

    // Down hard, back with overshoot: a pad should feel struck rather than
    // clicked, so the release is where the energy is.
    press.value = withSequence(
      withTiming(0.94, { duration: 60, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 9, stiffness: 260, mass: 0.6 }),
    );
    ring.value = 0;
    ring.value = withTiming(1, { duration: 620, easing: Easing.out(Easing.cubic) });
  };

  const padStyle = useAnimatedStyle(() => ({
    opacity: deal.value,
    transform: [
      { translateY: (1 - deal.value) * 30 },
      // The press dip multiplies the deal's scale rather than replacing it, so
      // a pad struck mid-deal still gives under the finger.
      { scale: press.value * (0.9 + deal.value * 0.1) },
      { rotate: `${(1 - deal.value) * tilt}deg` },
    ],
  }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value * 0.45 }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - ring.value) * 0.5,
    transform: [{ scale: 0.15 + ring.value * 1.15 }],
  }));

  // Big enough to clear the corners of the widest tile it can sit on.
  const ringSize = Math.max(dims.w, dims.h) * 1.5;

  return (
    <Animated.View style={padStyle}>
      <Pressable
        // Fires on touch-down. Waiting for the release adds a beat of lag that
        // makes the board feel like a form rather than an instrument.
        onPressIn={() => { viaTouch.current = true; hit(); }}
        onPress={() => { if (!viaTouch.current) hit(); viaTouch.current = false; }}
        accessibilityRole="button"
        accessibilityLabel={`Play ${pad.label}`}
        style={[
          styles.pad,
          { width: dims.w, height: dims.h, borderRadius: dims.r, padding: Math.round(spacing[3] * scale) },
        ]}
      >
        <Glass radius={dims.r} intensity={30} fill={pad.hue} style={StyleSheet.absoluteFillObject} />
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: dims.r, backgroundColor: pad.ink },
            flashStyle,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              marginLeft: -ringSize / 2,
              marginTop: -ringSize / 2,
            },
            ringStyle,
          ]}
        />
        <Text
          style={[
            styles.label,
            {
              color: pad.ink,
              fontSize: Math.round(LABEL_SIZE[pad.size] * scale),
              letterSpacing: LABEL_SIZE[pad.size] * -0.02,
            },
          ]}
          numberOfLines={2}
          adjustsFontSizeToFit
        >
          {pad.label}
        </Text>
        <Text style={styles.caption} numberOfLines={1}>{pad.caption}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function SoundBoard({ active }: { active: boolean }) {
  const { ready, play } = useSoundBoard(active);
  const [a, b, c, d, e, f, g, h, i, j] = PADS;

  const wake = useAnimatedStyle(() => ({
    opacity: withTiming(ready ? 1 : 0.45, { duration: 260 }),
  }));

  return (
    <Animated.View style={[styles.board, wake]}>
      <View style={styles.row}>
        <PadButton pad={a} index={0} onHit={play} />
        <View style={styles.col}>
          <PadButton pad={b} index={1} onHit={play} />
          <PadButton pad={c} index={2} onHit={play} />
        </View>
      </View>
      <View style={styles.row}>
        <PadButton pad={d} index={3} onHit={play} />
        <View style={styles.col}>
          <PadButton pad={e} index={4} onHit={play} />
          <PadButton pad={f} index={5} onHit={play} />
        </View>
      </View>
      <View style={styles.strip}>
        <View style={styles.row}>
          <PadButton pad={g} index={6} onHit={play} />
          <PadButton pad={h} index={7} onHit={play} />
        </View>
        <View style={styles.row}>
          <PadButton pad={i} index={8} onHit={play} />
          <PadButton pad={j} index={9} onHit={play} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  board: { gap: spacing[3] },
  row: { flexDirection: 'row', gap: spacing[3] },
  col: { gap: spacing[3] },
  strip: { gap: spacing[3] },
  pad: {
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  ring: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  label: {
    fontFamily: 'Barlow-Black',
    includeFontPadding: false,
  },
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: 'rgba(240,240,240,0.62)',
    marginTop: 2,
  },
});
