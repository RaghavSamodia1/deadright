import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../tokens';
import { Avatar } from '../Avatar/Avatar';
import { Icon } from '../Icon/Icon';

type NavVariant = 'home' | 'back' | 'modal';

interface NavAction {
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  /**
   * Let the action size to its own content instead of the 34pt icon square.
   * For controls that grow — the soundboard toggle expands into a labelled
   * pill — a fixed square would clip them.
   */
  wide?: boolean;
}

interface NavHeaderProps {
  variant?: NavVariant;
  title?: string;
  onBack?: () => void;
  rightActions?: NavAction[];
  // Home variant
  showAvatar?: boolean;
  avatarInitials?: string;
  /**
   * What the drawn face is derived from, and the photo when there is one.
   *
   * Without these the header seeded the Avatar on the *initials*, so it drew a
   * different face from every other Avatar for the same person — including
   * their own profile — and an uploaded photo never appeared in the header at
   * all.
   */
  avatarUri?: string;
  avatarSeed?: string;
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
  avatarUri,
  avatarSeed,
  onAvatarPress,
  style,
}: NavHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top },
        style,
      ]}
    >
      <View style={styles.inner}>
        {/* Left */}
        <View style={[styles.side, variant === 'home' && styles.sideAuto]}>
          {variant === 'back' && onBack && (
            <Pressable
              onPress={onBack}
              style={styles.iconBtn}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Icon name="back" size={18} color={colors.text.secondary} strokeWidth={2} />
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
            <Text style={styles.brandName}>DeadRight</Text>
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
              style={action.wide ? styles.iconBtnWide : styles.iconBtn}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={action.accessibilityLabel}
            >
              {action.icon}
            </Pressable>
          ))}
          {showAvatar && (
            <Pressable onPress={onAvatarPress} accessibilityRole="button" accessibilityLabel="Open profile">
              <Avatar
                size="sm"
                initials={avatarInitials}
                uri={avatarUri}
                seed={avatarSeed ?? avatarInitials}
              />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Transparent so the drifting light behind the app carries all the way to
    // the top. An opaque bar cut a hard black band across the room.
    backgroundColor: 'transparent',
  },
  inner: {
    height: 46,
    paddingBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenGutter,
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // Home has no centre title to balance, so the left side sizes to the
  // wordmark and the right side absorbs the slack. At flex:1 each half got
  // half the bar, and the expanded soundboard pill had nowhere to grow.
  sideAuto: {
    flex: 0,
  },
  right: {
    justifyContent: 'flex-end',
    // Keeps the actions off the wordmark. On a 320dp screen the expanded
    // soundboard pill ended up 5dp from the "t" in DeadRight.
    marginLeft: spacing[3],
  },
  iconBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    // No fill. The tinted square read as a button chrome the rest of the header
    // does not have, and next to the round avatar it looked like two different
    // control systems sharing a bar.
  },
  // Same height and centring as iconBtn, but free to be as wide as it needs.
  iconBtnWide: {
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  textBtn: {
    height: 34,
    justifyContent: 'center',
  },
  textAction: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.text.secondary,
  },
  brandName: {
    fontFamily: 'Barlow-Black',
    fontSize: 19,
    color: colors.interactive.primary,
    letterSpacing: -0.4,
  },
  title: {
    fontFamily: 'Barlow-Bold',
    fontSize: 16,
    color: colors.text.primary,
    textAlign: 'center',
    flex: 2,
  },
});
