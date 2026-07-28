import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../tokens';
import { Avatar, AvatarSize } from '../Avatar/Avatar';

interface Person {
  initials: string;
  avatarUri?: string;
  isMe?: boolean;
}

interface AvatarStackProps {
  people: Person[];
  /** Side tint for all avatars in the stack */
  tint?: 'a' | 'b' | 'neutral';
  size?: AvatarSize;
  max?: number;
  style?: ViewStyle;
}

const SIZE_PX: Record<AvatarSize, number> = { xs: 24, sm: 32, md: 40, lg: 64, xl: 96 };

export function AvatarStack({
  people,
  tint = 'neutral',
  size = 'xs',
  max = 4,
  style,
}: AvatarStackProps) {
  const shown = people.slice(0, max);
  const overflow = people.length - shown.length;
  const dim = SIZE_PX[size];
  const overlap = Math.round(dim * 0.35);

  return (
    <View style={[styles.row, style]}>
      {shown.map((p, i) => (
        <View key={i} style={{ marginLeft: i === 0 ? 0 : -overlap, zIndex: shown.length - i }}>
          <View style={styles.ring}>
            <Avatar size={size} initials={p.initials} uri={p.avatarUri} tint={tint} isMe={p.isMe} />
          </View>
        </View>
      ))}

      {overflow > 0 && (
        <View style={[styles.overflow, { width: dim, height: dim, borderRadius: dim / 2, marginLeft: -overlap }]}>
          <Text style={[styles.overflowText, { fontSize: dim * 0.32 }]}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ring: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.bg.surface1,
  },
  overflow: {
    backgroundColor: colors.bg.surface3,
    borderWidth: 2,
    borderColor: colors.bg.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: {
    fontFamily: 'Barlow-Bold',
    color: colors.text.secondary,
  },
});
