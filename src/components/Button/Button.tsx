import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius } from '../../tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
export type ButtonSize = 'lg' | 'md' | 'sm';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, { bg: string; text: string; pressedBg: string; border?: string }> = {
  primary: {
    bg: colors.interactive.primary,
    text: colors.text.inverse,
    pressedBg: colors.interactive.pressed,
  },
  secondary: {
    bg: colors.bg.surface2,
    text: colors.text.primary,
    pressedBg: colors.bg.surface3,
    border: colors.border.default,
  },
  destructive: {
    bg: colors.interactive.destructive,
    text: colors.text.primary,
    pressedBg: '#D94040',
  },
  ghost: {
    bg: 'transparent',
    text: colors.text.secondary,
    pressedBg: colors.bg.surface2,
  },
};

const SIZE_STYLES: Record<ButtonSize, { height: number; px: number; borderRadius: number; fontSize: number }> = {
  lg: { height: 52, px: 24, borderRadius: radius.lg, fontSize: 17 },
  md: { height: 44, px: 20, borderRadius: radius.md, fontSize: 15 },
  sm: { height: 36, px: 14, borderRadius: radius.sm, fontSize: 13 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  haptic = true,
}: ButtonProps) {
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];

  const handlePress = () => {
    if (haptic && !disabled) {
      Haptics.impactAsync(
        variant === 'primary'
          ? Haptics.ImpactFeedbackStyle.Heavy
          : Haptics.ImpactFeedbackStyle.Light,
      );
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          height: s.height,
          paddingHorizontal: s.px,
          borderRadius: s.borderRadius,
          backgroundColor: disabled
            ? colors.interactive.disabled
            : pressed
              ? v.pressedBg
              : v.bg,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border ?? 'transparent',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: loading ? 0.7 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={disabled ? colors.text.secondary : v.text} size="small" />
      ) : (
        <Text
          style={[
            styles.label,
            {
              fontSize: s.fontSize,
              // tertiary on the disabled fill is only 3.70:1
              color: disabled ? colors.text.secondary : v.text,
              fontFamily: size === 'sm' ? 'Barlow-SemiBold' : 'Barlow-Bold',
              letterSpacing: variant === 'primary' ? 0.5 : 0,
              textTransform: variant === 'primary' ? 'uppercase' : 'none',
            },
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  label: {
    includeFontPadding: false,
  },
});
