import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  ViewStyle,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import { colors, radius, spacing } from '../../tokens';

interface TextInputProps extends Omit<RNTextInputProps, 'style'> {
  label?: string;
  helper?: string;
  error?: string;
  maxChars?: number;
  showCounter?: boolean;
  multiline?: boolean;
  containerStyle?: ViewStyle;
}

export function TextInput({
  label,
  helper,
  error,
  maxChars,
  showCounter = false,
  multiline = false,
  value = '',
  onChangeText,
  containerStyle,
  ...rest
}: TextInputProps) {
  const [focused, setFocused] = useState(false);
  const charCount = value.length;
  const nearLimit = maxChars ? charCount >= maxChars * 0.7 : false;

  // Unfocused, the glass rim is the edge — a second grey border on top of it
  // read as two frames around one field. Focus and error still get a real ring,
  // because those have to be unmistakable.
  const borderColor = error
    ? colors.interactive.destructive
    : focused
      ? colors.border.strong
      : 'transparent';

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputWrap,
          { borderColor, minHeight: multiline ? 88 : 52 },
        ]}
      >
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={colors.text.secondary /* placeholder on surface-3: tertiary is only 3.93:1 */}
          maxLength={maxChars}
          multiline={multiline}
          style={[styles.input, multiline && styles.multiline]}
          {...rest}
        />
      </View>

      <View style={styles.footer}>
        {(error || helper) && (
          <Text style={[styles.helper, error && styles.errorText]}>
            {error ?? helper}
          </Text>
        )}
        {showCounter && maxChars && nearLimit && (
          <Text style={[styles.counter, charCount >= maxChars && styles.errorText]}>
            {charCount}/{maxChars}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.semantic.awaiting,
  },
  inputWrap: {
    backgroundColor: colors.bg.surface3,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    justifyContent: 'center',
    overflow: 'hidden',
  },
  input: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.text.primary,
    paddingVertical: 14,
  },
  multiline: {
    textAlignVertical: 'top',
    minHeight: 72,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helper: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.text.tertiary,
    flex: 1,
  },
  errorText: {
    color: colors.interactive.destructive,
  },
  counter: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.text.tertiary,
  },
});
