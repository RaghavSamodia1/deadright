import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../tokens';
import { StyleSheet as RNStyleSheet } from 'react-native';
import { Toggle } from '../Toggle/Toggle';
import { Icon, type IconName } from '../Icon/Icon';

interface SettingsRowProps {
  icon?: IconName;
  label: string;
  /** Right-side value text — "GBP £", "Mutual" */
  value?: string;
  /** Renders a Toggle instead of chevron/value */
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  /** Coral label — "Delete account" */
  destructive?: boolean;
  showChevron?: boolean;
  style?: ViewStyle;
}

/** Settings menu row: icon + label + (value | toggle | chevron). */
export function SettingsRow({
  icon,
  label,
  value,
  toggle = false,
  toggleValue = false,
  onToggle,
  onPress,
  destructive = false,
  showChevron = true,
  style,
}: SettingsRowProps) {
  const Wrapper = onPress && !toggle ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      style={[styles.row, style]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      {icon && (
        <View style={styles.iconBox}>
          <Icon name={icon} size={18} color={colors.text.secondary} strokeWidth={1.9} />
        </View>
      )}

      <Text style={[styles.label, destructive && { color: colors.interactive.destructive }]}>
        {label}
      </Text>

      {value && <Text style={styles.value}>{value}</Text>}
      {toggle && onToggle && <Toggle value={toggleValue} onChange={onToggle} />}
      {!toggle && showChevron && !destructive && <Text style={styles.chevron}>›</Text>}
    </Wrapper>
  );
}

/** Section wrapper — amber overline + grouped rows on surface-1. */
export function SettingsSection({ title, children, style }: { title: string; children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.section, style]}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <View style={styles.group}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: 14,
    minHeight: 52,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: radius.xs,
    backgroundColor: colors.bg.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 15 },
  label: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: colors.text.primary,
  },
  value: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.text.tertiary,
  },
  chevron: {
    fontFamily: 'Inter-Regular',
    fontSize: 20,
    color: colors.text.tertiary,
  },
  section: {
    gap: spacing[2],
  },
  sectionTitle: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
    paddingHorizontal: spacing[1],
  },
  group: {
    backgroundColor: colors.bg.surface1,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
});
