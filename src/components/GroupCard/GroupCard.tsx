import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, elevation } from '../../tokens';
import { StyleSheet as RNStyleSheet } from 'react-native';
import { Icon } from '../Icon/Icon';
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
          backgroundColor: pressed ? colors.bg.surface2 : colors.bg.surface1,
          // Unselected, the glass rim is the edge. Selection still gets a real
          // amber ring — it's the only thing telling one card from the next, so
          // it can't be a subtle shift in fill.
          borderColor: selected ? colors.interactive.primary : 'transparent',
          borderWidth: selected ? 1.5 : 1,
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
          {/* Was an empty <Text> — the emoji pass took the tick out and left
              the element behind, so "selected" rendered as a blank amber dot. */}
          <Icon name="check" size={13} color={colors.text.inverse} strokeWidth={2.6} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...elevation.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderRadius: radius.md,
    padding: spacing[4],
    backgroundColor: colors.bg.surface1,
    overflow: 'hidden',
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
});
