import React from 'react';
import { View, Text, StyleSheet, Animated, Easing, LayoutChangeEvent } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
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
 * Tapping it grows the pill leftward out of its own icon and uncovers the word
 * from underneath. The icon holds still because the header row is right-aligned
 * — only the pill's left edge travels — so it reads as the button opening
 * rather than the header rearranging itself.
 *
 * This uses RN's Animated rather than Reanimated, and deliberately: every child
 * here is absolutely positioned, so the pill has no intrinsic width, and a
 * width driven from the UI thread never reaches Yoga. The pill *looked* right
 * while the Pressable wrapping it stayed 0pt wide, leaving a touch target made
 * entirely of hitSlop — about 7dp of it, sitting next to the icon rather than
 * on it. Width is layout, so it has to be animated where layout can see it.
 */
export function SoundToggle({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const [wordWidth, setWordWidth] = React.useState(0);
  const reveal = wordWidth > 0 ? wordWidth + GAP : 0;

  const p = React.useRef(new Animated.Value(active ? 1 : 0)).current;

  React.useEffect(() => {
    const to = active ? 1 : 0;
    if (reduced) {
      p.setValue(to);
      return;
    }
    const anim = Animated.timing(p, {
      toValue: to,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      // Width is a layout prop: the native driver cannot touch it, and we need
      // Yoga to follow so the button stays as big as it looks.
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [active, reduced]);

  const pillWidth = p.interpolate({
    inputRange: [0, 1],
    outputRange: [COLLAPSED, COLLAPSED + reveal],
  });
  const clipWidth = p.interpolate({ inputRange: [0, 1], outputRange: [0, reveal] });
  // The skin arrives ahead of the word so the pill exists before it fills.
  const skinOpacity = p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 1] });
  const wordOpacity = p.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0, 1] });

  const onWordLayout = (e: LayoutChangeEvent) => {
    const w = Math.ceil(e.nativeEvent.layout.width);
    if (w && w !== wordWidth) setWordWidth(w);
  };

  return (
    <Animated.View style={[styles.pill, { width: pillWidth }]}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: skinOpacity }]}>
        <Glass
          radius={radius.full}
          intensity={20}
          rim={0.6}
          fill="rgba(226,102,31,0.22)"
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Off-layout copy, purely to measure the word at its natural width. It
          needs a box with room in it: measured directly inside the pill, the
          available width *was* the pill's own animated width, so the reading fed
          the thing it was measuring. No numberOfLines here either — a clamped
          line reports the clamp. */}
      <View pointerEvents="none" style={styles.rulerBox}>
        <Text style={styles.word} onLayout={onWordLayout}>
          SOUNDBOARD
        </Text>
      </View>

      {/* row-reverse: the icon is written first and lands on the right, which
          is the edge that stays put. */}
      <View style={styles.row} pointerEvents="none">
        <Icon
          name="waveform"
          size={20}
          color={active ? colors.brand.flame : colors.text.secondary}
          strokeWidth={1.9}
        />
        <Animated.View style={[styles.clip, { width: clipWidth }]}>
          {/* Explicit width, so the text is laid out at full size and the clip
              does the hiding. Left to fit the clip, iOS would ellipsize a single
              line rather than let it overflow — the word would read "SOU…" for
              most of the animation instead of being uncovered. */}
          <Animated.Text
            style={[
              styles.word,
              styles.revealed,
              { width: wordWidth || undefined, opacity: wordOpacity },
            ]}
            numberOfLines={1}
          >
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
  rulerBox: {
    position: 'absolute',
    left: 0,
    top: 0,
    // Wider than the word can plausibly be at any font scale, so the text
    // inside is never the thing under measurement pressure.
    width: 400,
    flexDirection: 'row',
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
