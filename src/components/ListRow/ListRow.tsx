import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../tokens';

interface ListRowProps {
  title: string;
  subtitle?: string;
  /** Left status dot colour */
  dotColor?: string;
  /** Left slot — icon or avatar */
  left?: React.ReactNode;
  /** Right slot — value, chip, chevron */
  right?: React.ReactNode;
  /** Right-side value text (shorthand for a simple label) */
  value?: string;
  valueColor?: string;
  onPress?: () => void;
  showChevron?: boolean;
  /** Elevated (unread) treatment */
  elevated?: boolean;
  style?: ViewStyle;
}

export function ListRow({
  title,
  subtitle,
  dotColor,
  left,
  right,
  value,
  valueColor = colors.text.primary,
  onPress,
  showChevron = false,
  elevated = false,
  style,
}: ListRowProps) {
  const Container = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      style={[
        styles.row,
        { backgroundColor: elevated ? colors.bg.surface2 : colors.bg.surface1 },
        style,
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      {dotColor && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
      {left}

      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {value && <Text style={[styles.value, { color: valueColor }]}>{value}</Text>}
      {right}
      {showChevron && <Text style={styles.chevron}>›</Text>}
    </Container>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    // Was spacing[4]/64: with a title and subtitle the padding dominated the
    // row and left it looking half empty.
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    minHeight: 56,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 14,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.text.tertiary,
  },
  value: {
    fontFamily: 'Barlow-Bold',
    fontSize: 15,
  },
  chevron: {
    fontFamily: 'Inter-Regular',
    fontSize: 22,
    color: colors.text.tertiary,
  },
});
