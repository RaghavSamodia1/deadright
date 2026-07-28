import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '../../tokens';
import { Avatar } from '../Avatar/Avatar';
import { StatusChip, BetStatus } from '../StatusChip/StatusChip';
import { SideBar } from '../SideBar/SideBar';
import { Timer } from '../Timer/Timer';

export interface BetCardData {
  id: string;
  title: string;
  status: BetStatus;
  author: { handle: string; initials: string; avatarUri?: string };
  group?: string;
  sideAPercent: number;
  sideACount: number;
  sideBCount: number;
  participantCount: number;
  stake?: string;
  deadline: Date;
  isCreator?: boolean;
}

interface BetCardProps {
  bet: BetCardData;
  onPress: (bet: BetCardData) => void;
  compact?: boolean;
  style?: ViewStyle;
}

// Maps status → card background & text colour override
const STATUS_CARD_STYLE: Record<
  BetStatus,
  { bg: string; textColor: string; textOpacity: number } | null
> = {
  active: null,
  live: null,
  awaiting: { bg: colors.card.amber, textColor: colors.text.inverse, textOpacity: 1 },
  win: { bg: colors.card.mint, textColor: colors.text.inverse, textOpacity: 1 },
  loss: null,
  disputed: { bg: colors.card.coral, textColor: colors.text.primary, textOpacity: 1 },
  controversial: { bg: colors.card.violet, textColor: colors.text.primary, textOpacity: 1 },
};

export function BetCard({ bet, onPress, compact = false, style }: BetCardProps) {
  const override = STATUS_CARD_STYLE[bet.status];
  const cardBg = override?.bg ?? colors.bg.surface1;
  const titleColor = override?.textColor ?? colors.text.primary;
  const metaColor = override
    ? `rgba(${override.textColor === colors.text.inverse ? '14,18,26' : '240,240,240'},0.65)`
    : colors.text.tertiary;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(bet);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: cardBg,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Bet: ${bet.title}. Status: ${bet.status}.`}
    >
      {/* Author row */}
      <View style={styles.authorRow}>
        <Avatar size="sm" initials={bet.author.initials} uri={bet.author.avatarUri} tint="a" />
        <View style={styles.authorMeta}>
          <Text style={[styles.handle, { color: titleColor }]}>{bet.author.handle}</Text>
          {bet.group && (
            <Text style={[styles.groupLabel, { color: metaColor }]}>{bet.group}</Text>
          )}
        </View>
        <StatusChip status={bet.status} isCreator={bet.isCreator} />
      </View>

      {/* Bet title */}
      <Text
        style={[styles.title, { color: titleColor }]}
        numberOfLines={compact ? 1 : 2}
      >
        "{bet.title}"
      </Text>

      {/* Side distribution */}
      {!compact && (
        <SideBar
          sideAPercent={bet.sideAPercent}
          sideACount={bet.sideACount}
          sideBCount={bet.sideBCount}
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.meta, { color: metaColor }]}>
          👥 {bet.participantCount}
        </Text>
        <View style={styles.dot} />
        {bet.stake && (
          <>
            <Text style={[styles.meta, { color: metaColor }]}>{bet.stake}</Text>
            <View style={styles.dot} />
          </>
        )}
        <Timer deadline={bet.deadline} size="sm" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[4],
    gap: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorMeta: {
    flex: 1,
    gap: 1,
  },
  handle: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 12,
  },
  groupLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
  },
  title: {
    fontFamily: 'Barlow-Bold',
    fontSize: 16,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meta: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
  },
  dot: {
    width: 1,
    height: 12,
    backgroundColor: colors.border.default,
  },
});
