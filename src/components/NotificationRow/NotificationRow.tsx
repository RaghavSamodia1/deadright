import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../tokens';
import { Avatar } from '../Avatar/Avatar';

export type NotificationAction = 'join' | 'resolve' | 'view-dispute' | null;

interface NotificationRowProps {
  avatar: { initials: string; uri?: string; tint?: 'a' | 'b' | 'neutral' };
  text: string;
  meta: string; // "Sunday League · 2h ago"
  unread?: boolean;
  action?: NotificationAction;
  onPress: () => void;
  onAction?: () => void;
  style?: ViewStyle;
}

const ACTION_CONFIG: Record<Exclude<NotificationAction, null>, { label: string; color: string }> = {
  join: { label: 'JOIN →', color: colors.semantic.awaiting },
  resolve: { label: 'RESOLVE →', color: colors.semantic.awaiting },
  'view-dispute': { label: 'VIEW →', color: colors.semantic.disputed },
};

/** Alerts feed row: avatar + text + contextual action chip + unread dot. */
export function NotificationRow({ avatar, text, meta, unread = false, action = null, onPress, onAction, style }: NotificationRowProps) {
  const actionCfg = action ? ACTION_CONFIG[action] : null;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.row,
        { backgroundColor: unread ? colors.bg.surface2 : colors.bg.surface1 },
        style,
      ]}
      accessibilityRole="button"
    >
      <Avatar size="md" initials={avatar.initials} uri={avatar.uri} tint={avatar.tint ?? 'auto'} />

      <View style={styles.body}>
        <Text style={styles.text} numberOfLines={2}>{text}</Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>

      {actionCfg && onAction && (
        <Pressable
          onPress={onAction}
          style={[styles.actionChip, { backgroundColor: `${actionCfg.color}33` }]}
          accessibilityRole="button"
          accessibilityLabel={actionCfg.label}
        >
          <Text style={[styles.actionLabel, { color: actionCfg.color }]}>{actionCfg.label}</Text>
        </Pressable>
      )}

      {unread && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderRadius: radius.sm,
    padding: spacing[3],
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  body: { flex: 1, gap: 4 },
  text: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 13,
    lineHeight: 17,
    color: colors.text.primary,
  },
  meta: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: colors.text.tertiary,
  },
  actionChip: {
    borderRadius: radius.xs,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionLabel: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.semantic.awaiting,
  },
});
