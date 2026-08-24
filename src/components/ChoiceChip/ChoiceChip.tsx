import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, relief } from '../../tokens';

interface ChoiceChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

/**
 * The repeating chip pattern used across Create Bet (type / stake / deadline /
 * resolution). Selected = amber fill, navy text. Learn it once, use everywhere.
 */
export function ChoiceChip({ label, selected = false, onPress, style }: ChoiceChipProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected
            ? colors.interactive.primary
            : pressed
              ? colors.bg.surface3
              : colors.bg.surface2,
          borderColor: selected ? colors.interactive.primary : colors.border.default,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.label, { color: selected ? colors.text.inverse : colors.text.secondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

interface ChoiceChipGroupProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
}

/** Single-select row of ChoiceChips with wrap. */
export function ChoiceChipGroup<T extends string>({
  options,
  value,
  onChange,
  style,
}: ChoiceChipGroupProps<T>) {
  return (
    <View style={[styles.group, style]}>
      {options.map((opt) => (
        <ChoiceChip
          key={opt.value}
          label={opt.label}
          selected={opt.value === value}
          onPress={() => onChange(opt.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    ...relief,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 14,
  },
  group: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
});
