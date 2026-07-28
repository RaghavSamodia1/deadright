import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../tokens';

interface UploadedItem {
  id: string;
  filename: string;
  sizeLabel: string; // "2.1 MB · just now"
}

interface UploadZoneProps {
  onPick: () => void;
  items?: UploadedItem[];
  onRemove?: (id: string) => void;
  hint?: string;
  style?: ViewStyle;
}

/** Dashed amber evidence drop zone + uploaded file rows (Resolution flow). */
export function UploadZone({ onPick, items = [], onRemove, hint = 'Tap to add photo or video', style }: UploadZoneProps) {
  return (
    <View style={[styles.wrap, style]}>
      <Pressable onPress={onPick} style={styles.zone} accessibilityRole="button" accessibilityLabel="Add evidence">
        <Text style={styles.icon}>📷</Text>
        <Text style={styles.hint}>{hint}</Text>
      </Pressable>

      {items.map((item) => (
        <View key={item.id} style={styles.item}>
          <View style={styles.thumb} />
          <View style={styles.itemBody}>
            <Text style={styles.filename} numberOfLines={1}>{item.filename}</Text>
            <Text style={styles.size}>{item.sizeLabel}</Text>
          </View>
          {onRemove && (
            <Pressable onPress={() => onRemove(item.id)} hitSlop={8} accessibilityLabel={`Remove ${item.filename}`}>
              <Text style={styles.remove}>×</Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing[3] },
  zone: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.semantic.awaiting,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(247,200,70,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
    gap: spacing[2],
  },
  icon: { fontSize: 34 },
  hint: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.text.tertiary,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.bg.surface1,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.sm,
    padding: spacing[3],
  },
  thumb: {
    width: 32,
    height: 32,
    borderRadius: radius.xs,
    backgroundColor: colors.bg.surface3,
  },
  itemBody: { flex: 1, gap: 2 },
  filename: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.text.primary,
  },
  size: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: colors.text.tertiary,
  },
  remove: {
    fontFamily: 'Inter-Regular',
    fontSize: 20,
    color: colors.text.tertiary,
  },
});
