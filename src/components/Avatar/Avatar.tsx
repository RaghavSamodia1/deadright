import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '../../tokens';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  size?: AvatarSize;
  initials?: string;
  uri?: string;
  // Side A or B colour — used on participant stacks
  tint?: 'a' | 'b' | 'neutral';
  // Show "You" badge overlay
  isMe?: boolean;
  style?: ViewStyle;
}

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
};

const FONT_SIZE_MAP: Record<AvatarSize, number> = {
  xs: 9,
  sm: 12,
  md: 14,
  lg: 22,
  xl: 32,
};

const TINT_MAP = {
  a: colors.side.a,
  b: colors.side.b,
  neutral: colors.bg.surface2,
};

export function Avatar({ size = 'sm', initials, uri, tint = 'neutral', isMe = false, style }: AvatarProps) {
  const dim = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];
  const bg = TINT_MAP[tint];

  return (
    <View style={[styles.wrapper, { width: dim, height: dim, borderRadius: dim / 2 }, style]}>
      <View style={[styles.circle, { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: bg }]}>
        {uri ? (
          <Image source={{ uri }} style={{ width: dim, height: dim, borderRadius: dim / 2 }} />
        ) : (
          <Text style={[styles.initials, { fontSize }]}>
            {(initials ?? '?').slice(0, 2).toUpperCase()}
          </Text>
        )}
      </View>

      {isMe && (
        <View style={[styles.meBadge, { borderRadius: radius.full }]}>
          <Text style={styles.meText}>You</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontFamily: 'Barlow-Bold',
    color: colors.text.primary,
  },
  meBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.semantic.awaiting,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  meText: {
    fontFamily: 'Barlow-Bold',
    fontSize: 7,
    color: colors.text.inverse,
  },
});
