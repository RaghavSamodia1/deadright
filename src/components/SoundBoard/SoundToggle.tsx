import React from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, radius } from '../../tokens';
import { Glass } from '../Glass/Glass';
import { Icon } from '../Icon/Icon';

/** Icon square, matching every other header button at rest. */
const COLLAPSED = 34;
/** Breathing room between the revealed word and the icon. */
const GAP = 7;

/**
 * The soundboard toggle, which is also its label.
 *
 * A separate badge beside the wordmark said the same thing twice and crowded
 * the icons. Here the control *is* the mode indicator: tap it and it grows
 * leftward out of its own icon, the word emerging from underneath. The icon
 * holds still because the header row is right-aligned — only the pill's left
 * edge travels — so it reads as the button opening rather than the whole header
 * rearranging itself.
 *
 * Nothing is allowed to be wider than the pill: the word lives in a clip whose
 * width is animated alongside it. The first version anchored an over-wide row
 * inside `overflow: hidden` and let the clipping do the work, which looked
 * right open and ate three-fifths of the icon shut.
 *
 * The width comes from measuring the word rather than a hardcoded guess, so a
 * larger font scale doesn't truncate it.
 */
export function SoundToggle({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const [wordWidth, setWordWidth] = React.useState(0);
  const reveal = wordWidth > 0 ? wordWidth + GAP : 0;

  const p = useSharedValue(active ? 1 : 0);

  React.useEffect(() => {
    p.value = reduced
      ? active
        ? 1
        : 0
      : withTiming(active ? 1 : 0, {
          duration: 380,
          easing: Easing.out(Easing.cubic),
        });
  }, [active, reduced]);

  const pill = useAnimatedStyle(() => ({ width: COLLAPSED + reveal * p.value }));
  const clip = useAnimatedStyle(() => ({ width: reveal * p.value }));
  // The skin arrives ahead of the word so the pill exists before it fills.
  const skin = useAnimatedStyle(() => ({ opacity: Math.min(1, p.value * 2) }));
  const word = useAnimatedStyle(() => ({
    opacity: Math.max(0, (p.value - 0.25) / 0.75),
  }));

  const onWordLayout = (e: LayoutChangeEvent) => {
    const w = Math.ceil(e.nativeEvent.layout.width);
    if (w && w !== wordWidth) setWordWidth(w);
  };

  return (
    <Animated.View style={[styles.pill, pill]}>
      <Animated.View style={[StyleSheet.absoluteFillObject, skin]}>
        <Glass
          radius={radius.full}
          intensity={20}
          rim={0.6}
          fill="rgba(226,102,31,0.22)"
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Off-layout copy, purely to measure the word at its natural width —
          the visible one lives inside a clip that is 0 wide most of the time. */}
      <Text
        style={[styles.word, styles.ruler]}
        numberOfLines={1}
        onLayout={onWordLayout}
      >
        SOUNDBOARD
      </Text>

      {/* row-reverse: the icon is written first and lands on the right, which
          is the edge that stays put. */}
      <View style={styles.row}>
        <Icon
          name="waveform"
          size={20}
          color={active ? colors.brand.flame : colors.text.secondary}
          strokeWidth={1.9}
        />
        <Animated.View style={[styles.clip, clip]}>
          <Animated.Text style={[styles.word, styles.revealed, word]} numberOfLines={1}>
            SOUNDBOARD
          </Animated.Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: COLLAPSED,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  row: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 7,
  },
  clip: {
    height: '100%',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // Anchored to the clip's right edge, so the word is uncovered from under the
  // icon rather than sliding in from off-screen.
  revealed: {
    position: 'absolute',
    right: GAP,
  },
  ruler: {
    position: 'absolute',
    left: 0,
    opacity: 0,
  },
  word: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.brand.flame,
    includeFontPadding: false,
  },
});
