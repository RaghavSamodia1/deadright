import React, { useEffect } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, spring } from '../../tokens';

export type ToastType = 'info' | 'success' | 'error' | 'undo';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  /** ms before auto-dismiss (0 = sticky) */
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss: () => void;
}

const ACCENT: Record<ToastType, string> = {
  info: colors.text.secondary,
  success: colors.semantic.win,
  error: colors.interactive.destructive,
  undo: colors.semantic.awaiting,
};

export function Toast({
  visible,
  message,
  type = 'info',
  duration = 4000,
  actionLabel,
  onAction,
  onDismiss,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, spring.emphasis);
      opacity.value = withTiming(1, { duration: 150 });

      if (duration > 0) {
        const timer = setTimeout(() => {
          translateY.value = withTiming(120);
          opacity.value = withTiming(0, { duration: 150 }, (done) => {
            if (done) runOnJS(onDismiss)();
          });
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [visible, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        { bottom: insets.bottom + spacing.tabBarTotal, borderLeftColor: ACCENT[type] },
        animatedStyle,
      ]}
    >
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      {actionLabel && onAction && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.action, { color: ACCENT[type] }]}>{actionLabel}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.screenGutter,
    right: spacing.screenGutter,
    backgroundColor: colors.bg.surface2,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.primary,
  },
  action: {
    fontFamily: 'Barlow-Bold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
