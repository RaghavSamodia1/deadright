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
import { Glass } from '../Glass/Glass';

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
    // Off-white on coral is 2.79:1 — a destructive action was the least
    // readable control in the app. Navy on coral is 5.90:1. The pressed shade
    // moved too: navy on the old #D94040 was 4.25:1, still short of AA.
    text: colors.text.inverse,
    pressedBg: '#E04A42',
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
  // The secondary button is a surface, not an accent, so it frosts with
  // everything else — left solid it became the only opaque grey block on
  // screens where the cards had all gone to glass. Primary and destructive keep
  // their fills: those are the colour that carries the meaning.
  const isGlass = variant === 'secondary' && !disabled && !loading;

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
          backgroundColor: isGlass
            ? 'transparent'
            : disabled
              ? colors.interactive.disabled
              : pressed
                ? v.pressedBg
                : v.bg,
          overflow: isGlass ? 'hidden' : 'visible',
          borderWidth: v.border && !isGlass ? 1 : 0,
          borderColor: v.border && !isGlass ? v.border : 'transparent',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: loading ? 0.7 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {({ pressed }) => (
      <>
      {isGlass && (
        <Glass
          radius={s.borderRadius}
          intensity={24}
          fill={pressed ? 'rgba(255,255,255,0.14)' : undefined}
          style={StyleSheet.absoluteFillObject}
        />
      )}
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
      </>
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
