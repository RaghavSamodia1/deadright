import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '../../tokens';
import { Avatar } from '../Avatar/Avatar';
import { StatusChip, BetStatus } from '../StatusChip/StatusChip';
import { SideBar } from '../SideBar/SideBar';
import { Timer } from '../Timer/Timer';
import { Icon } from '../Icon/Icon';
import { Glass } from '../Glass/Glass';

export interface BetCardData {
  id: string;
  title: string;
  status: BetStatus;
  author: { handle: string; initials: string; avatarUri?: string };
  group?: string;
  sideAPercent: number;
  sideACount: number;
  sideBCount: number;
  /** What the two sides are called — YES/NO, OVER/UNDER, or whatever was set. */
  sideALabel?: string;
  sideBLabel?: string;
  /** Set when this is a call bet: everyone names their own, closest wins. */
  callKind?: 'number' | 'date';
  callUnit?: string;
  calls?: { handle: string; value: string; isWinner: boolean; isMe: boolean }[];
  /** What actually happened, once it is settled. */
  actual?: string;
  participantCount: number;
  stake?: string;
  deadline: Date;
  isCreator?: boolean;
  /** Ranking bets have no sides, so the A/B bar is meaningless for them. */
  isOrdinal?: boolean;
}

interface BetCardProps {
  bet: BetCardData;
  onPress: (bet: BetCardData) => void;
  compact?: boolean;
  style?: ViewStyle;
}

// Status used to repaint the whole card — amber for awaiting, mint for a win,
// coral for disputed. A feed of those reads as a shout, and a win is the least
// useful thing to spend the loudest colour on. The chip carries status now and
// every card sits on the same surface, so colour means something when it does
// appear. (colors.cardInk still exists: the jar and bento tiles are genuinely
// filled and need ink that survives on them.)
export function BetCard({ bet, onPress, compact = false, style }: BetCardProps) {
  const titleColor = colors.text.primary;
  const metaColor = colors.text.tertiary;

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
          // Glass rather than a solid fill, so the light behind the app carries
          // through the feed instead of stopping at a wall of grey rectangles.
          backgroundColor: 'transparent',
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Bet: ${bet.title}. Status: ${bet.status}.`}
    >
      <Glass radius={radius.md} intensity={26} style={StyleSheet.absoluteFillObject} />

      {/* Author row */}
      <View style={styles.authorRow}>
        <Avatar size="sm" initials={bet.author.initials} uri={bet.author.avatarUri} seed={bet.author.handle} />
        {/* Author and group on one line. Stacked, they were two lines of small
            text competing with the title for the top of the card; the person
            who called it is context, not the headline. */}
        <View style={styles.authorMeta}>
          <Text style={[styles.handle, { color: metaColor }]} numberOfLines={1}>
            {bet.author.handle}
            {bet.group ? <Text style={styles.groupLabel}>{`  ·  ${bet.group}`}</Text> : null}
          </Text>
        </View>
        <StatusChip status={bet.status} isCreator={bet.isCreator} />
      </View>

      {/* Bet title */}
      {/* The claim is the card. It was set at 17 in the same weight as
          everything else and wrapped in quote marks, so nothing on the card was
          louder than anything else and the eye had nowhere to land. Quotes
          removed too: they add a pair of marks to every card in the feed to say
          something the card already says. */}
      <Text
        style={[styles.title, compact && styles.titleCompact, { color: titleColor }]}
        numberOfLines={compact ? 1 : 3}
      >
        {bet.title}
      </Text>

      {/* A call bet shows what everyone actually said. There is no split to
          draw: the positions are the answers, not two buckets. */}
      {!compact && bet.callKind && (
        <View style={styles.calls}>
          {(bet.calls ?? []).length === 0 ? (
            <Text style={styles.callsEmpty}>
              Nobody has called it yet{bet.callUnit ? ` — how many ${bet.callUnit}?` : ''}
            </Text>
          ) : (
            <>
              {bet.actual && (
                <View style={styles.actualRow}>
                  <Text style={styles.actualLabel}>ACTUAL</Text>
                  <Text style={styles.actualValue}>{bet.actual}</Text>
                </View>
              )}
              {(bet.calls ?? []).slice(0, 4).map((c, i) => (
                <View key={i} style={[styles.callRow, c.isWinner && styles.callRowWon]}>
                  <Text
                    style={[styles.callWho, c.isMe && styles.callWhoMe]}
                    numberOfLines={1}
                  >
                    {c.isMe ? 'You' : c.handle}
                  </Text>
                  <Text style={[styles.callValue, c.isWinner && styles.callValueWon]}>
                    {c.value}
                  </Text>
                </View>
              ))}
              {(bet.calls ?? []).length > 4 && (
                <Text style={styles.callsEmpty}>
                  +{(bet.calls ?? []).length - 4} more
                </Text>
              )}
            </>
          )}
        </View>
      )}

      {/* Side distribution — a ranking bet has no sides to distribute. */}
      {!compact && !bet.isOrdinal && !bet.callKind && (
        <View style={styles.sides}>
          <SideBar
            sideAPercent={bet.sideAPercent}
            sideACount={bet.sideACount}
            sideBCount={bet.sideBCount}
            labelA={bet.sideALabel}
            labelB={bet.sideBLabel}
          />
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.metaGroup}>
          <Icon name="users" size={13} color={metaColor} strokeWidth={2} />
          <Text style={[styles.meta, { color: metaColor }]}>{bet.participantCount}</Text>
        </View>
        {bet.stake && (
          <>
            <View style={styles.dot} />
            <Text style={[styles.meta, { color: metaColor }]}>{bet.stake}</Text>
          </>
        )}
        {/* Pushed to the right margin so the countdown anchors the card's
            trailing edge instead of trailing a separator dot. */}
        <Timer
          deadline={bet.deadline}
          size="sm"
          style={styles.timer}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    padding: spacing[4],
    // No uniform gap: the rhythm is what carries the hierarchy. Author sits
    // close under nothing, the claim gets air, the footer is pushed away from
    // it so the countdown reads as its own thing.
    gap: 0,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorMeta: {
    flex: 1,
  },
  handle: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  groupLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  title: {
    fontFamily: 'Barlow-Black',
    fontSize: 21,
    lineHeight: 25,
    letterSpacing: -0.4,
    marginTop: 12,
  },
  titleCompact: { fontSize: 17, lineHeight: 21, marginTop: 10 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  meta: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  dot: {
    width: 1,
    height: 12,
    backgroundColor: colors.border.default,
  },
  sides: { marginTop: 14 },
  calls: { marginTop: 14, gap: 6 },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  callRowWon: { backgroundColor: 'rgba(99,185,114,0.18)' },
  callWho: { fontFamily: 'Inter-Medium', fontSize: 13, color: colors.text.secondary, flexShrink: 1 },
  callWhoMe: { color: colors.text.primary },
  callValue: { fontFamily: 'SpaceMono-Bold', fontSize: 15, color: colors.text.primary },
  callValueWon: { color: colors.semantic.win },
  callsEmpty: { fontFamily: 'Inter-Regular', fontSize: 12.5, color: colors.text.tertiary },
  actualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.semantic.awaiting,
    marginBottom: 2,
  },
  actualLabel: {
    fontFamily: 'Barlow-Black', fontSize: 11, letterSpacing: 1,
    color: colors.cardInk.onLight.primary,
  },
  actualValue: {
    fontFamily: 'SpaceMono-Bold', fontSize: 15,
    color: colors.cardInk.onLight.primary,
  },
  timer: { marginLeft: 'auto' },
  metaGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
