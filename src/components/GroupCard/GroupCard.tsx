import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '../../tokens';
import { AvatarStack } from '../AvatarStack/AvatarStack';
import { plural } from '../../lib/plural';

interface GroupCardProps {
  emoji: string;
  name: string;
  memberCount: number;
  members: { initials: string; avatarUri?: string }[];
  /** Active bets in this group */
  activeBets?: number;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

/** Group row used in Create-flow group picker and Profile → Groups. */
export function GroupCard({
  emoji,
  name,
  memberCount,
  members,
  activeBets,
  selected = false,
  onPress,
  style,
}: GroupCardProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: selected ? colors.interactive.primary : colors.border.default,
          borderWidth: selected ? 1.5 : 1,
          backgroundColor: pressed ? colors.bg.surface2 : colors.bg.surface1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${name}, ${plural(memberCount, 'member')}`}
    >
      <View style={styles.emojiBox}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.meta}>
          {plural(memberCount, 'member')}
          {activeBets !== undefined ? ` · ${plural(activeBets, 'active bet')}` : ''}
        </Text>
      </View>

      <AvatarStack people={members} size="xs" max={3} />

      {selected && (
        <View style={styles.check}>
          <Text style={styles.checkMark}></Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderRadius: radius.md,
    padding: spacing[4],
  },
  emojiBox: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.bg.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 22 },
  body: { flex: 1, gap: 2 },
  name: {
    fontFamily: 'Barlow-Bold',
    fontSize: 15,
    color: colors.text.primary,
  },
  meta: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.text.tertiary,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.interactive.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontFamily: 'Barlow-Bold',
    fontSize: 12,
    color: colors.text.inverse,
  },
});
