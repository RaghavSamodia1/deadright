import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { PEEPS } from './peeps';
import { colors, radius } from '../../tokens';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  size?: AvatarSize;
  initials?: string;
  uri?: string;
  /**
   * 'auto' (the default) colours the circle from `seed`, so a person is the
   * same colour everywhere they appear. 'a' and 'b' are the side colours and
   * stay reserved for places where which side someone took is the point;
   * 'neutral' opts out entirely.
   */
  tint?: 'a' | 'b' | 'neutral' | 'auto';
  /** What the colour is derived from — a handle where there is one. */
  seed?: string;
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
  a: '#4E4E57',
  b: '#5A5A64',
  neutral: colors.bg.surface2,
};

/**
 * Ten colours from the app's own palette. Every avatar in the app used to be
 * one of three greys, and almost every caller asked for the same one — the most
 * repeated element in the product carried no information at all. A colour
 * derived from the handle means a person looks the same in a member list, on a
 * bet card and in the jar feed, so you start recognising people before you have
 * read the name.
 *
 * All ten take the same dark ink: the worst pairing is violet at 4.59:1, so
 * there is no per-colour exception to remember.
 */
const IDENTITY = [
  colors.semantic.awaiting, colors.brand.flame, colors.semantic.disputed,
  colors.semantic.win, colors.side.a, colors.side.b,
  '#B3AEFF', '#7FD6CD', '#FFB37A', '#6C63FF',
];
const IDENTITY_INK = '#0A0A0B';

/** FNV-1a. Stable across platforms and sessions, which is the whole point. */
function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/**
 * Below this the drawn face is mush and two initials are simply more use — a
 * 24pt avatar in a stack is there to say how many people, not who.
 */
const FACE_MIN = 32;

export function Avatar({ size = 'sm', initials, uri, tint = 'auto', seed, isMe = false, style }: AvatarProps) {
  const dim = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];
  const auto = tint === 'auto';
  const h = hash(seed ?? initials ?? '?');
  const bg = auto ? IDENTITY[h % IDENTITY.length] : TINT_MAP[tint];
  // One hash decides both, so a person's colour and their face always agree.
  const face = dim >= FACE_MIN ? PEEPS[h % PEEPS.length] : null;

  return (
    <View style={[styles.wrapper, { width: dim, height: dim, borderRadius: dim / 2 }, style]}>
      <View style={[styles.circle, { width: dim, height: dim, borderRadius: dim / 2, backgroundColor: bg }]}>
        {uri ? (
          <Image source={{ uri }} style={{ width: dim, height: dim, borderRadius: dim / 2 }} />
        ) : face ? (
          <Image source={face} style={{ width: dim, height: dim }} resizeMode="contain" />
        ) : (
          <Text style={[styles.initials, { fontSize }, auto && { color: IDENTITY_INK }]}>
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
