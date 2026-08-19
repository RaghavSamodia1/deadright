import React, { useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spring } from '../../tokens';
import { Glass } from '../Glass/Glass';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 100;

interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  // How much of the screen the sheet takes (0–1). Default: auto (content-height)
  snapPoint?: number;
  showHandle?: boolean;
  /**
   * Restrict the drag-to-dismiss gesture to the handle.
   *
   * The pan is attached to the whole sheet by default, which is right for short
   * sheets but makes a scrollable one unusable: dragging to scroll the list gets
   * captured as a sheet drag instead. Sheets with scrolling content set this.
   */
  dragFromHandleOnly?: boolean;
}

export function BottomSheet({
  visible,
  onDismiss,
  children,
  snapPoint,
  showHandle = true,
  dragFromHandleOnly = false,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayOpacity = useSharedValue(0);

  const open = useCallback(() => {
    overlayOpacity.value = withTiming(1, { duration: 200 });
    translateY.value = withSpring(0, spring.emphasis);
  }, []);

  const close = useCallback((cb?: () => void) => {
    overlayOpacity.value = withTiming(0, { duration: 200 });
    translateY.value = withSpring(SCREEN_HEIGHT, spring.standard, () => {
      if (cb) runOnJS(cb)();
    });
  }, []);

  useEffect(() => {
    if (visible) open();
    else close();
  }, [visible]);

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
        overlayOpacity.value = 1 - e.translationY / SCREEN_HEIGHT;
      }
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_THRESHOLD || e.velocityY > 1000) {
        runOnJS(onDismiss)();
      } else {
        translateY.value = withSpring(0, spring.standard);
        overlayOpacity.value = withTiming(1, { duration: 150 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  if (!visible) return null;

  const body = (
    <Animated.View
      style={[
        styles.sheet,
        { paddingBottom: insets.bottom + 16 },
        snapPoint ? { height: SCREEN_HEIGHT * snapPoint } : null,
        sheetStyle,
      ]}
    >
      {/* The pane is dropped a corner-radius below the sheet so its bottom
          corners round off-screen — the sheet is flush to the bottom edge and
          two rounded notches there would show the scrim through them. */}
      <Glass
        radius={radius.lg}
        intensity={44}
        // A modal has to occlude. Frosted at the same strength as a card, the
        // sheet let the screen behind it read straight through — the settings
        // rows interleaved with the sheet's own options and both became
        // unreadable. The wash is mostly opaque, so the sheet still catches the
        // light in the room and keeps its rim without competing with content it
        // is supposed to be covering. This also means it does not depend on the
        // blur landing: on a device where expo-blur is weak it still occludes.
        fill="rgba(18,18,21,0.82)"
        style={[StyleSheet.absoluteFillObject, { bottom: -radius.lg }]}
      />
      {showHandle &&
        (dragFromHandleOnly ? (
          // The only draggable area, so the list below scrolls normally. Padded
          // out to a usable target rather than the 4pt bar itself.
          <GestureDetector gesture={gesture}>
            <View style={styles.handleGrip}>
              <View style={styles.handle} />
            </View>
          </GestureDetector>
        ) : (
          <View style={styles.handle} />
        ))}
      {children}
    </Animated.View>
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Scrim */}
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      </Animated.View>

      {/* Sheet */}
      {dragFromHandleOnly ? body : <GestureDetector gesture={gesture}>{body}</GestureDetector>}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    // Lighter than colors.bg.overlay (0.72) so the sheet has something behind
    // it to catch, but not so light that the screen underneath stays legible.
    backgroundColor: 'rgba(6,6,8,0.62)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // Auto-height sheets grew past the top of the screen with no way back —
    // a 41-row list put its first options off-screen and unreachable.
    maxHeight: SCREEN_HEIGHT * 0.9,
    backgroundColor: 'transparent',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handleGrip: {
    paddingTop: 4,
    paddingBottom: 8,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.bg.surface3,
    alignSelf: 'center',
    marginBottom: 20,
  },
});
