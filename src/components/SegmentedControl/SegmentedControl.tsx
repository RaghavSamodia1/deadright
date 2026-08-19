import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, spring } from '../../tokens';

interface SegmentedControlProps<T extends string> {
  segments: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
}

/**
 * The selected pill slides between segments instead of teleporting.
 *
 * It used to be a background colour that moved by re-rendering: the pill simply
 * vanished from one segment and appeared on the next, so nothing connected where
 * you were to where you went. One shared indicator on a spring carries that
 * relationship, and it costs nothing — the pill was already being drawn.
 */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const reduced = useReducedMotion();
  const [width, setWidth] = React.useState(0);
  const index = Math.max(0, segments.findIndex((s) => s.value === value));

  const seg = width > 0 ? (width - 8 - (segments.length - 1) * 4) / segments.length : 0;
  const x = useSharedValue(0);

  React.useEffect(() => {
    const target = index * (seg + 4);
    x.value = reduced ? target : withSpring(target, spring.fast);
  }, [index, seg, reduced]);

  const pill = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    width: seg,
  }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {seg > 0 && <Animated.View style={[styles.pill, pill]} />}

      {segments.map((s) => {
        const active = s.value === value;
        return (
          <Pressable
            key={s.value}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(s.value);
            }}
            style={styles.segment}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{s.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.bg.surface2,
    borderRadius: radius.full,
    padding: 4,
    gap: 4,
    position: 'relative',
  },
  // Sits under the labels and slides; the segments themselves are now just
  // hit targets and text.
  pill: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    backgroundColor: colors.interactive.primary,
    borderRadius: radius.full,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 13,
    color: colors.text.secondary,
  },
  labelActive: { color: colors.text.inverse },
});
