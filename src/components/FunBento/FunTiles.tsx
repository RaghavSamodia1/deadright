import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { colors, radius, spacing } from '../../tokens';
import { Icon } from '../Icon/Icon';
import { Avatar } from '../Avatar/Avatar';
import { CountUp } from '../Motion/CountUp';
import { tileSizesFor, tileScaleFor } from '../BentoTile/BentoTile';

// Animated press hook for fun tactile feedback
function useFunPress(onPress?: () => void) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(
      withSpring(0.94, { damping: 10, stiffness: 450 }),
      withSpring(1.02, { damping: 8, stiffness: 350 }),
      withSpring(1, { damping: 12, stiffness: 300 }),
    );
    if (onPress) onPress();
  };

  return { animatedStyle, handlePress };
}

// -----------------------------------------------------------------------------
// 1. FUN FORM TILE (Arcade Cosmic Orb)
// -----------------------------------------------------------------------------
interface FunFormTileProps {
  score: number;
  onPress?: () => void;
}

export function FunFormTile({ score, onPress }: FunFormTileProps) {
  const { width } = useWindowDimensions();
  const dims = tileSizesFor(width).stat;
  const scale = tileScaleFor(width);
  const { animatedStyle, handlePress } = useFunPress(onPress);

  return (
    <Animated.View style={[{ width: dims.w, height: dims.h }, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        style={[styles.tilePressable, { borderRadius: dims.r }]}
        accessibilityRole="button"
        accessibilityLabel={`Form score, ${score}`}
      >
        <LinearGradient
          colors={['#2B1A4A', '#1C1134', '#140C24']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: dims.r }]}
        />
        {/* Glow border */}
        <View style={[styles.borderGlow, { borderRadius: dims.r, borderColor: 'rgba(179, 136, 255, 0.4)' }]} />

        {/* Top Header Row */}
        <View style={styles.statHeaderRow}>
          <View style={styles.badgePurple}>
            <Text style={styles.badgePurpleText}>🔮 LVL {Math.floor(score / 10)}</Text>
          </View>
          <Text style={styles.sparkleIcon}>✨</Text>
        </View>

        {/* Big Score */}
        <View style={styles.scoreRow}>
          <CountUp
            value={score}
            format={(n) => String(Math.round(n))}
            style={[styles.statValueText, { fontSize: Math.round(28 * scale), color: '#D4BBFF' }]}
          />
        </View>

        {/* Label & link */}
        <View style={styles.statBottomRow}>
          <Text style={[styles.statLabelText, { color: '#B39DDB' }]}>FORM CRED</Text>
          <Text style={[styles.statSubText, { color: '#E1D5F5' }]}>Details →</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// -----------------------------------------------------------------------------
// 2. FUN STREAK TILE (Fiery Ember Flame)
// -----------------------------------------------------------------------------
interface FunStreakTileProps {
  currentStreak: number;
  bestStreak: number;
  onPress?: () => void;
}

export function FunStreakTile({ currentStreak, bestStreak, onPress }: FunStreakTileProps) {
  const { width } = useWindowDimensions();
  const dims = tileSizesFor(width).stat;
  const scale = tileScaleFor(width);
  const { animatedStyle, handlePress } = useFunPress(onPress);

  return (
    <Animated.View style={[{ width: dims.w, height: dims.h }, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        style={[styles.tilePressable, { borderRadius: dims.r }]}
        accessibilityRole="button"
        accessibilityLabel={`Streak, ${currentStreak} times, Best ${bestStreak}`}
      >
        <LinearGradient
          colors={['#421A04', '#2B1002', '#1C0A01']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: dims.r }]}
        />
        {/* Glow border */}
        <View style={[styles.borderGlow, { borderRadius: dims.r, borderColor: 'rgba(255, 107, 0, 0.45)' }]} />

        {/* Top Header Row */}
        <View style={styles.statHeaderRow}>
          <View style={styles.badgeOrange}>
            <Text style={styles.badgeOrangeText}>🔥 HOT STREAK</Text>
          </View>
        </View>

        {/* Big Streak */}
        <View style={styles.scoreRow}>
          <Text style={[styles.statValueText, { fontSize: Math.round(28 * scale), color: '#FFA040' }]}>
            {currentStreak}×
          </Text>
        </View>

        {/* Label & best */}
        <View style={styles.statBottomRow}>
          <Text style={[styles.statLabelText, { color: '#FF7A00' }]}>STREAK</Text>
          <Text style={[styles.statSubText, { color: '#FFD1A4' }]}>Best: {bestStreak}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// -----------------------------------------------------------------------------
// 3. FUN SQUAD / GROUPS TILE (The Crew Clubhouse)
// -----------------------------------------------------------------------------
interface FunSquadTileProps {
  count: number;
  onPress?: () => void;
}

export function FunSquadTile({ count, onPress }: FunSquadTileProps) {
  const { width } = useWindowDimensions();
  const dims = tileSizesFor(width).feature;
  const scale = tileScaleFor(width);
  const { animatedStyle, handlePress } = useFunPress(onPress);

  return (
    <Animated.View style={[{ width: dims.w, height: dims.h }, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        style={[styles.tilePressable, { borderRadius: dims.r, padding: spacing[3] }]}
        accessibilityRole="button"
        accessibilityLabel={`Groups & people, ${count}`}
      >
        <LinearGradient
          colors={['#18233C', '#101728', '#0B0F1B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: dims.r }]}
        />
        <View style={[styles.borderGlow, { borderRadius: dims.r, borderColor: 'rgba(92, 140, 255, 0.4)' }]} />

        {/* Top Tag */}
        <View style={styles.squadTopRow}>
          <View style={styles.squadBadge}>
            <Text style={styles.squadBadgeText}>👥 THE SQUAD</Text>
          </View>
          <Text style={styles.squadOpenArrow}>Open them →</Text>
        </View>

        {/* Avatars row + Count */}
        <View style={styles.squadCenterRow}>
          {/* Overlapping colorful avatar circles */}
          <View style={styles.avatarStack}>
            <View style={[styles.avatarBubble, { backgroundColor: '#FF6B6B', zIndex: 3 }]}>
              <Avatar size="sm" initials="DR" seed="mate1" />
            </View>
            <View style={[styles.avatarBubble, { backgroundColor: '#4ECDC4', left: 24, zIndex: 2 }]}>
              <Avatar size="sm" initials="TM" seed="mate2" />
            </View>
            <View style={[styles.avatarBubble, { backgroundColor: '#FFE66D', left: 48, zIndex: 1 }]}>
              <Avatar size="sm" initials="GG" seed="mate3" />
            </View>
          </View>

          {/* Group count number */}
          <View style={styles.squadCountCol}>
            <Text style={[styles.squadCountText, { fontSize: Math.round(34 * scale) }]}>
              {count}
            </Text>
            <Text style={styles.squadCountLabel}>
              {count === 1 ? 'ACTIVE GROUP' : 'ACTIVE GROUPS'}
            </Text>
          </View>
        </View>

        {/* Bottom banner */}
        <View style={styles.squadBottomRow}>
          <Text style={styles.squadSubCaption}>Your circle of informal wagers</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// -----------------------------------------------------------------------------
// 4. FUN LEDGER TILE (Neon Cash Slip)
// -----------------------------------------------------------------------------
interface FunLedgerTileProps {
  amountText: string;
  isPositive: boolean;
  onPress?: () => void;
}

export function FunLedgerTile({ amountText, isPositive, onPress }: FunLedgerTileProps) {
  const { width } = useWindowDimensions();
  const dims = tileSizesFor(width).nav;
  const { animatedStyle, handlePress } = useFunPress(onPress);

  const glowColor = isPositive ? 'rgba(99, 185, 114, 0.45)' : 'rgba(252, 87, 78, 0.45)';
  const textColor = isPositive ? '#8AE98D' : '#FC574E';
  const bgGrad = (isPositive
    ? ['#0C2518', '#071A10']
    : ['#280F12', '#1A090B']) as [string, string, ...string[]];

  return (
    <Animated.View style={[{ width: dims.w, height: dims.h }, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        style={[styles.tilePressable, { borderRadius: dims.r, paddingHorizontal: 10, paddingVertical: 8 }]}
        accessibilityRole="button"
        accessibilityLabel={`Ledger, ${amountText}`}
      >
        <LinearGradient
          colors={bgGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: dims.r }]}
        />
        <View style={[styles.borderGlow, { borderRadius: dims.r, borderColor: glowColor }]} />

        <View style={styles.navRow}>
          <View style={styles.navIconWrap}>
            <Text style={{ fontSize: 13 }}>{isPositive ? '📈' : '📉'}</Text>
          </View>
          <Text style={[styles.navValue, { color: textColor }]} numberOfLines={1}>
            {amountText}
          </Text>
        </View>
        <View style={styles.navBottomRow}>
          <Text style={[styles.navLabel, { color: isPositive ? '#A8EDB3' : '#FFA8A3' }]}>LEDGER</Text>
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>→</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// -----------------------------------------------------------------------------
// 5. FUN SETTLE TILE (3D Rolling Dice)
// -----------------------------------------------------------------------------
interface FunSettleTileProps {
  onPress?: () => void;
}

export function FunSettleTile({ onPress }: FunSettleTileProps) {
  const { width } = useWindowDimensions();
  const dims = tileSizesFor(width).nav;
  const { animatedStyle, handlePress } = useFunPress(onPress);

  return (
    <Animated.View style={[{ width: dims.w, height: dims.h }, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        style={[styles.tilePressable, { borderRadius: dims.r, paddingHorizontal: 10, paddingVertical: 8 }]}
        accessibilityRole="button"
        accessibilityLabel="Settle it"
      >
        <LinearGradient
          colors={['#0E2A2E', '#091C1E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: dims.r }]}
        />
        <View style={[styles.borderGlow, { borderRadius: dims.r, borderColor: 'rgba(127, 214, 205, 0.45)' }]} />

        <View style={styles.navRow}>
          <View style={[styles.navIconWrap, { backgroundColor: 'rgba(127, 214, 205, 0.2)' }]}>
            <Text style={{ fontSize: 13 }}>🎲</Text>
          </View>
          <Text style={[styles.navValue, { color: '#7FD6CD' }]} numberOfLines={1}>
            ROLL
          </Text>
        </View>
        <View style={styles.navBottomRow}>
          <Text style={[styles.navLabel, { color: '#A0EDE5' }]}>SETTLE IT</Text>
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>→</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// -----------------------------------------------------------------------------
// 6. FUN ACTION ROW (3D Candy "New Bet" + Confetti "Pools")
// -----------------------------------------------------------------------------
interface FunActionRowProps {
  onCreateBet: () => void;
  onPools: () => void;
}

export function FunActionRow({ onCreateBet, onPools }: FunActionRowProps) {
  const { width } = useWindowDimensions();
  const sizes = tileSizesFor(width);
  const bandDims = sizes.band;
  const statDims = sizes.stat;

  const newBetPress = useFunPress(onCreateBet);
  const poolsPress = useFunPress(onPools);

  return (
    <View style={styles.actionRow}>
      {/* 3D Golden Candy NEW BET Button */}
      <Animated.View style={[{ width: bandDims.w, height: bandDims.h }, newBetPress.animatedStyle]}>
        <Pressable
          onPress={newBetPress.handlePress}
          style={[styles.tilePressable, { borderRadius: bandDims.r, padding: spacing[3] }]}
          accessibilityRole="button"
          accessibilityLabel="New Bet, Call it now"
        >
          <LinearGradient
            colors={['#FFCE48', '#FF9F0A', '#E07700']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: bandDims.r }]}
          />
          {/* Subtle glossy top shine */}
          <View style={styles.candyShine} />

          <View style={styles.newBetContent}>
            <View style={styles.newBetLeft}>
              <View style={styles.lightningCircle}>
                <Text style={{ fontSize: 16 }}>⚡</Text>
              </View>
              <View>
                <Text style={styles.newBetHeading}>NEW BET</Text>
                <Text style={styles.newBetSub}>Call it right now →</Text>
              </View>
            </View>
            <View style={styles.newBetPlusBadge}>
              <Text style={styles.newBetPlusText}>+</Text>
            </View>
          </View>
        </Pressable>
      </Animated.View>

      {/* Playful POOLS Button */}
      <Animated.View style={[{ width: statDims.w, height: bandDims.h }, poolsPress.animatedStyle]}>
        <Pressable
          onPress={poolsPress.handlePress}
          style={[styles.tilePressable, { borderRadius: statDims.r, padding: spacing[3] }]}
          accessibilityRole="button"
          accessibilityLabel="Pools"
        >
          <LinearGradient
            colors={['#2D1C52', '#1B1135']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: statDims.r }]}
          />
          <View style={[styles.borderGlow, { borderRadius: statDims.r, borderColor: 'rgba(179, 140, 255, 0.4)' }]} />

          <View style={styles.poolsCenter}>
            <Text style={{ fontSize: 24, marginBottom: 2 }}>🎉</Text>
            <Text style={styles.poolsLabel}>POOLS</Text>
            <Text style={styles.poolsSub}>Rankings</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// -----------------------------------------------------------------------------
// STYLES
// -----------------------------------------------------------------------------
const styles = StyleSheet.create({
  tilePressable: {
    flex: 1,
    padding: spacing[3],
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  borderGlow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.2,
  },
  statHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgePurple: {
    backgroundColor: 'rgba(179, 136, 255, 0.22)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: radius.xs,
  },
  badgePurpleText: {
    fontFamily: 'Barlow-Bold',
    fontSize: 9.5,
    color: '#D1C4E9',
    letterSpacing: 0.5,
  },
  sparkleIcon: {
    fontSize: 11,
  },
  badgeOrange: {
    backgroundColor: 'rgba(255, 107, 0, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: radius.xs,
  },
  badgeOrangeText: {
    fontFamily: 'Barlow-Bold',
    fontSize: 9.5,
    color: '#FFB74D',
    letterSpacing: 0.5,
  },
  scoreRow: {
    marginVertical: 2,
  },
  statValueText: {
    fontFamily: 'Barlow-Black',
    letterSpacing: -1,
    includeFontPadding: false,
  },
  statBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  statLabelText: {
    fontFamily: 'Barlow-Bold',
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statSubText: {
    fontFamily: 'Inter-Medium',
    fontSize: 9.5,
  },
  squadTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  squadBadge: {
    backgroundColor: 'rgba(92, 140, 255, 0.22)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.xs,
  },
  squadBadgeText: {
    fontFamily: 'Barlow-Bold',
    fontSize: 10,
    color: '#A0C0FF',
    letterSpacing: 0.6,
  },
  squadOpenArrow: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    color: '#7AA7FF',
  },
  squadCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  avatarStack: {
    flexDirection: 'row',
    height: 36,
    width: 84,
    position: 'relative',
    alignItems: 'center',
  },
  avatarBubble: {
    position: 'absolute',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#101728',
    overflow: 'hidden',
  },
  squadCountCol: {
    alignItems: 'flex-end',
  },
  squadCountText: {
    fontFamily: 'Barlow-Black',
    color: '#E8F0FE',
    letterSpacing: -1,
    lineHeight: 38,
  },
  squadCountLabel: {
    fontFamily: 'Barlow-Bold',
    fontSize: 9,
    letterSpacing: 0.8,
    color: '#8EAEE0',
  },
  squadBottomRow: {
    marginTop: 'auto',
  },
  squadSubCaption: {
    fontFamily: 'Inter-Regular',
    fontSize: 10.5,
    color: 'rgba(232, 240, 254, 0.55)',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navValue: {
    fontFamily: 'Barlow-Black',
    fontSize: 18,
    letterSpacing: -0.5,
  },
  navBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  navLabel: {
    fontFamily: 'Barlow-Bold',
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  candyShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  newBetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  newBetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lightningCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E1202',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBetHeading: {
    fontFamily: 'Barlow-Black',
    fontSize: 16,
    color: '#160D02',
    letterSpacing: -0.3,
  },
  newBetSub: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    color: '#3D2403',
  },
  newBetPlusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBetPlusText: {
    fontFamily: 'Barlow-Black',
    fontSize: 18,
    color: '#160D02',
    marginTop: -2,
  },
  poolsCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  poolsLabel: {
    fontFamily: 'Barlow-Bold',
    fontSize: 11,
    color: '#D1C4E9',
    letterSpacing: 0.8,
  },
  poolsSub: {
    fontFamily: 'Inter-Medium',
    fontSize: 9.5,
    color: 'rgba(209, 196, 233, 0.65)',
  },
});
