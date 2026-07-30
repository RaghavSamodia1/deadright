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

// Maps status → card fill and the ink pair that stays legible on it. Nothing
// here may fall back to the global text tokens: those assume a dark surface,
// and on these fills they drop as low as 1.00:1 (see colors.cardInk).
type CardInk = { primary: string; muted: string; chip: string };

const STATUS_CARD_STYLE: Record<BetStatus, { bg: string; ink: CardInk } | null> = {
  active: null,
  live: null,
  awaiting: { bg: colors.card.amber, ink: colors.cardInk.onLight },
  win: { bg: colors.card.mint, ink: colors.cardInk.onLight },
  loss: null,
  // Off-white on coral is only 2.79:1 — navy on coral is 5.90:1.
  disputed: { bg: colors.card.coral, ink: colors.cardInk.onLight },
  controversial: { bg: colors.card.violet, ink: colors.cardInk.onDark },
};

/** Inks for the default dark card, so every branch below has a full set. */
const SURFACE_INK = {
  primary: colors.text.primary,
  muted: colors.text.tertiary,
  chip: colors.bg.surface2,
};

export function BetCard({ bet, onPress, compact = false, style }: BetCardProps) {
  const override = STATUS_CARD_STYLE[bet.status];
  const cardBg = override?.bg ?? colors.bg.surface1;
  const ink = override?.ink ?? SURFACE_INK;
  const titleColor = ink.primary;
  // Was a 0.65-alpha blend of the title colour, which on the coral card came
  // out at 2.62:1. The muted ink is a measured value instead of a guess.
  const metaColor = ink.muted;
  const dotColor = override ? ink.muted : colors.border.default;

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
        <StatusChip status={bet.status} isCreator={bet.isCreator} ink={override ? ink : undefined} />
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
          ink={override ? ink : undefined}
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.meta, { color: metaColor }]}>
          👥 {bet.participantCount}
        </Text>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        {bet.stake && (
          <>
            <Text style={[styles.meta, { color: metaColor }]}>{bet.stake}</Text>
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
          </>
        )}
        <Timer deadline={bet.deadline} size="sm" ink={override ? ink.primary : undefined} />
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
  },
});
