import React from 'react';
import { Text, Pressable, ScrollView, StyleSheet, Dimensions } from 'react-native';
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

/** Beyond this many rows the list scrolls instead of growing the sheet. */
const SCROLL_AFTER = 7;
const MAX_LIST_HEIGHT = Dimensions.get('window').height * 0.55;

/**
 * Action sheet built on BottomSheet — "Keep editing / Save draft / Discard".
 * Destructive rows are coral; a Cancel row is appended automatically.
 *
 * Long lists (the 41-entry currency picker) scroll. They used to render every row
 * into an auto-height sheet anchored to the bottom, so the sheet ran off the top
 * of the screen and the rows up there could be neither seen nor scrolled to — and
 * the sheet's drag-to-dismiss pan swallowed any attempt to scroll them. Cancel
 * stays outside the scroll area so it is always in reach.
 */
export function ActionSheet({ visible, title, options, onDismiss }: ActionSheetProps) {
  const handleOption = (opt: ActionSheetOption) => {
    Haptics.impactAsync(
      opt.destructive ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light,
    );
    onDismiss();
    opt.onPress();
  };

  const scrolls = options.length > SCROLL_AFTER;

  const rows = options.map((opt, i) => (
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
  ));

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss} dragFromHandleOnly={scrolls}>
      {title && <Text style={styles.title}>{title}</Text>}

      {scrolls ? (
        <ScrollView
          style={{ maxHeight: MAX_LIST_HEIGHT }}
          showsVerticalScrollIndicator
          // The rows are Pressables, so without this the first tap after a flick
          // only stops the momentum instead of choosing anything.
          keyboardShouldPersistTaps="handled"
        >
          {rows}
        </ScrollView>
      ) : (
        rows
      )}

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
