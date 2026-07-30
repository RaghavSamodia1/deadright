import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../tokens';
import { Avatar } from '../Avatar/Avatar';

type NavVariant = 'home' | 'back' | 'modal';

interface NavAction {
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
}

interface NavHeaderProps {
  variant?: NavVariant;
  title?: string;
  onBack?: () => void;
  rightActions?: NavAction[];
  // Home variant
  showAvatar?: boolean;
  avatarInitials?: string;
  onAvatarPress?: () => void;
  style?: ViewStyle;
}

export function NavHeader({
  variant = 'back',
  title,
  onBack,
  rightActions = [],
  showAvatar = false,
  avatarInitials,
  onAvatarPress,
  style,
}: NavHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          borderBottomColor: colors.border.subtle,
        },
        style,
      ]}
    >
      <View style={styles.inner}>
        {/* Left */}
        <View style={styles.side}>
          {variant === 'back' && onBack && (
            <Pressable
              onPress={onBack}
              style={styles.iconBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.backArrow}>←</Text>
            </Pressable>
          )}
          {variant === 'modal' && onBack && (
            <Pressable
              onPress={onBack}
              style={styles.textBtn}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.textAction}>Cancel</Text>
            </Pressable>
          )}
          {variant === 'home' && (
            <Text style={styles.brandName}>
              DeadRight<Text style={styles.brandEmoji}> 🔥</Text>
            </Text>
          )}
        </View>

        {/* Centre */}
        {title && variant !== 'home' && (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        )}

        {/* Right */}
        <View style={[styles.side, styles.right]}>
          {rightActions.map((action, i) => (
            <Pressable
              key={i}
              onPress={action.onPress}
              style={styles.iconBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={action.accessibilityLabel}
            >
              {action.icon}
            </Pressable>
          ))}
          {showAvatar && (
            <Pressable onPress={onAvatarPress} accessibilityRole="button" accessibilityLabel="Open profile">
              <Avatar size="sm" initials={avatarInitials} tint="a" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg.base,
    borderBottomWidth: 1,
  },
  inner: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenGutter,
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  right: {
    justifyContent: 'flex-end',
  },
  iconBtn: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBtn: {
    height: spacing.touchTarget,
    justifyContent: 'center',
  },
  backArrow: {
    fontFamily: 'Barlow-Bold',
    fontSize: 22,
    color: colors.text.secondary,
  },
  textAction: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.text.secondary,
  },
  brandName: {
    fontFamily: 'Barlow-Black',
    fontSize: 24,
    color: colors.interactive.primary,
    letterSpacing: -0.5,
  },
  brandEmoji: {
    fontSize: 20,
  },
  title: {
    fontFamily: 'Barlow-Bold',
    fontSize: 17,
    color: colors.text.primary,
    textAlign: 'center',
    flex: 2,
  },
});
