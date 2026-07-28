import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius } from '../../tokens';

const OTP_LENGTH = 6;

interface OTPInputProps {
  onComplete: (code: string) => void;
  onChangeText?: (code: string) => void;
  hasError?: boolean;
}

export function OTPInput({ onComplete, onChangeText, hasError = false }: OTPInputProps) {
  const [code, setCode] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setCode(cleaned);
    onChangeText?.(cleaned);
    if (cleaned.length === OTP_LENGTH) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete(cleaned);
    }
  };

  const focusInput = () => inputRef.current?.focus();

  return (
    <Pressable onPress={focusInput} style={styles.container} accessibilityLabel="OTP input">
      {/* Hidden real input */}
      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={OTP_LENGTH}
        autoFocus
        caretHidden
        style={styles.hiddenInput}
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
      />

      {/* Visual boxes */}
      <View style={styles.boxes}>
        {Array.from({ length: OTP_LENGTH }).map((_, i) => {
          const char = code[i];
          const isFocused = i === code.length && !hasError;
          return (
            <View
              key={i}
              style={[
                styles.box,
                isFocused && styles.boxFocused,
                char && styles.boxFilled,
                hasError && styles.boxError,
              ]}
            >
              <Text style={[styles.digit, hasError && { color: colors.side.b }]}>
                {char ?? ''}
              </Text>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  boxes: {
    flexDirection: 'row',
    gap: 10,
  },
  box: {
    width: 52,
    height: 64,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.bg.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFocused: {
    borderColor: colors.border.strong,
    borderBottomColor: colors.interactive.primary,
    borderBottomWidth: 2,
  },
  boxFilled: {
    backgroundColor: colors.bg.surface3,
    borderColor: colors.border.strong,
  },
  boxError: {
    borderColor: colors.side.b,
    backgroundColor: colors.semantic.disputedDim,
  },
  digit: {
    fontFamily: 'Barlow-Bold',
    fontSize: 28,
    color: colors.text.primary,
    includeFontPadding: false,
  },
});
