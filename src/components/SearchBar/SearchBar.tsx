import React, { useState } from 'react';
import { View, TextInput, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../tokens';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
  style?: ViewStyle;
}

/** Pill search input — Search tab, member pickers. */
export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search bets, people, groups…',
  onSubmit,
  autoFocus = false,
  style,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.bar,
        { borderColor: focused ? colors.border.strong : 'transparent' },
        style,
      ]}
    >
      <Text style={styles.icon}>⌕</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoFocus={autoFocus}
        style={styles.input}
        accessibilityRole="search"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityLabel="Clear search">
          <View style={styles.clear}>
            <Text style={styles.clearIcon}>×</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg.surface2,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing[4],
    height: 44,
    gap: spacing[2],
  },
  icon: {
    fontSize: 18,
    color: colors.text.tertiary,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  clear: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.bg.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIcon: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 15,
  },
});
