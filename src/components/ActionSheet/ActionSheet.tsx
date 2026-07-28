import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '../../tokens';
import { BottomSheet } from '../BottomSheet/BottomSheet';

export interface ActionSheetOption {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  /** Emphasized primary choice — amber text */
  primary?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  options: ActionSheetOption[];
  onDismiss: () => void;
}

/**
 * Action sheet built on BottomSheet — "Keep editing / Save draft / Discard".
 * Destructive rows are coral; a Cancel row is appended automatically.
 */
export function ActionSheet({ visible, title, options, onDismiss }: ActionSheetProps) {
  const handleOption = (opt: ActionSheetOption) => {
    Haptics.impactAsync(
      opt.destructive ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light,
    );
    onDismiss();
    opt.onPress();
  };

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      {title && <Text style={styles.title}>{title}</Text>}

      {options.map((opt, i) => (
        <Pressable
          key={i}
          onPress={() => handleOption(opt)}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: pressed ? colors.bg.surface3 : colors.bg.surface2 },
          ]}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.label,
              opt.destructive && { color: colors.interactive.destructive },
              opt.primary && { color: colors.interactive.primary },
            ]}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}

      <Pressable onPress={onDismiss} style={styles.cancel} accessibilityRole="button">
        <Text style={styles.cancelLabel}>Cancel</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  row: {
    borderRadius: radius.sm,
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  label: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 16,
    color: colors.text.primary,
  },
  cancel: {
    paddingVertical: spacing[4],
    alignItems: 'center',
    marginTop: spacing[1],
  },
  cancelLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.text.secondary,
  },
});
