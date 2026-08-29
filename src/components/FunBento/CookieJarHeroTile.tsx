import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import Svg, {
  Path,
  Circle,
  Rect,
  Ellipse,
  G,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '../../tokens';
import { CountUp } from '../Motion/CountUp';
import { tileSizesFor, tileScaleFor } from '../BentoTile/BentoTile';

interface CookieJarHeroTileProps {
  total: number;
  formatValue?: (n: number) => string;
  currency?: string | null;
  weekCount?: number;
  violationCount?: number;
  cap?: number;
  isMixed?: boolean;
  moreCount?: number;
  onPress?: () => void;
}

/**
 * Fun Cookie Jar Hero Tile
 * Renders an illustrated, tactile glass cookie jar with:
 * - Glass jar contours & metallic wire-clamp lid
 * - Glossy glass reflection & honey/amber translucent fill
 * - Piled chocolate chip cookies at the bottom that fill as the pot grows
 * - Artisanal taped pot label with animated currency total
 * - Cap progress meter at base
 * - Spring bounce & cookie rattle haptics on press
 */
export function CookieJarHeroTile({
  total,
  formatValue,
  weekCount = 0,
  violationCount = 0,
  cap = 50,
  isMixed = false,
  moreCount = 0,
  onPress,
}: CookieJarHeroTileProps) {
  const { width: windowWidth } = useWindowDimensions();
  const dims = tileSizesFor(windowWidth).hero;
  const scale = tileScaleFor(windowWidth);

  // Animated jiggle/scale on press
  const scaleAnim = useSharedValue(1);
  const rotateAnim = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleAnim.value },
      { rotateZ: `${rotateAnim.value}deg` },
    ],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scaleAnim.value = withSequence(
      withSpring(0.95, { damping: 10, stiffness: 400 }),
      withSpring(1.03, { damping: 8, stiffness: 350 }),
      withSpring(1, { damping: 12, stiffness: 300 }),
    );
    rotateAnim.value = withSequence(
      withSpring(-2.5, { damping: 8, stiffness: 500 }),
      withSpring(2.5, { damping: 8, stiffness: 500 }),
      withSpring(0, { damping: 10, stiffness: 400 }),
    );
    if (onPress) onPress();
  };

  const capProgress = Math.min(Math.max(total / (cap || 50), 0), 1);
  const cookieCount = total <= 0 ? 1 : Math.min(Math.max(Math.ceil(total * 2), 2), 6);

  const statusLabel =
    weekCount > 0
      ? `${weekCount} this week`
      : violationCount > 0
      ? `${violationCount} all time`
      : 'Nobody slipped yet';

  return (
    <Animated.View style={[styles.wrapper, { width: dims.w, height: dims.h }, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        style={styles.pressable}
        accessibilityRole="button"
        accessibilityLabel={`Cookie Jar, ${formatValue ? formatValue(total) : total}, ${statusLabel}`}
      >
        {/* Glow ambient background behind the glass jar */}
        <LinearGradient
          colors={['#2A1D0A', '#1E1508', '#140E06']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: dims.r }]}
        />

        {/* Golden ambient aura */}
        <View style={styles.ambientAura} />

        {/* The Illustrated SVG Glass Cookie Jar */}
        <View style={styles.jarSvgContainer}>
          <Svg width={dims.w - 16} height={dims.h - 16} viewBox="0 0 210 210">
            <Defs>
              {/* Glass sheen gradient */}
              <SvgGradient id="glassSheen" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
                <Stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.1" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </SvgGradient>

              {/* Glass liquid/honey fill */}
              <SvgGradient id="jarFill" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#F7C846" stopOpacity="0.22" />
                <Stop offset="100%" stopColor="#FF9900" stopOpacity="0.38" />
              </SvgGradient>

              {/* Lid metal gradient */}
              <SvgGradient id="lidMetal" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#8A7A5D" />
                <Stop offset="35%" stopColor="#E2CA98" />
                <Stop offset="65%" stopColor="#CBB47C" />
                <Stop offset="100%" stopColor="#7A6B4F" />
              </SvgGradient>

              {/* Cookie gradient */}
              <SvgGradient id="cookieDough" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#E5A853" />
                <Stop offset="50%" stopColor="#C67D28" />
                <Stop offset="100%" stopColor="#8F5012" />
              </SvgGradient>
            </Defs>

            {/* --- JAR LID & CLAMP --- */}
            {/* Lid Knob / Top Handle */}
            <Rect x="93" y="8" width="24" height="6" rx="3" fill="url(#lidMetal)" />
            <Rect x="98" y="14" width="14" height="4" fill="#5E513A" />

            {/* Main Lid Top */}
            <Rect x="68" y="17" width="74" height="12" rx="4" fill="url(#lidMetal)" />
            {/* Rubber gasket seal */}
            <Rect x="74" y="28" width="62" height="4" rx="1.5" fill="#E86C3F" opacity={0.9} />

            {/* Metal wire clamp latch on sides */}
            <Path d="M68 23 C 60 23, 58 35, 66 38" stroke="#D3BD8A" strokeWidth="2.2" fill="none" />
            <Path d="M142 23 C 150 23, 152 35, 144 38" stroke="#D3BD8A" strokeWidth="2.2" fill="none" />

            {/* --- JAR BODY (OUTLINE & GLASS BASE) --- */}
            {/* Main glass jar outline */}
            <Path
              d="M 72 32 
                 C 55 35, 30 55, 28 85 
                 C 25 125, 26 165, 32 188 
                 C 34 196, 44 202, 54 202 
                 L 156 202 
                 C 166 202, 176 196, 178 188 
                 C 184 165, 185 125, 182 85 
                 C 180 55, 155 35, 138 32 
                 Z"
              fill="url(#jarFill)"
              stroke="#F7C846"
              strokeWidth="2.4"
              strokeOpacity={0.65}
            />

            {/* Glass internal depth border */}
            <Path
              d="M 74 35 
                 C 58 38, 35 57, 33 86 
                 C 30 124, 31 163, 37 185 
                 C 38 191, 46 197, 56 197 
                 L 154 197 
                 C 164 197, 172 191, 173 185 
                 C 179 163, 180 124, 177 86 
                 C 175 57, 152 38, 136 35 
                 Z"
              fill="none"
              stroke="#FFE899"
              strokeWidth="1.2"
              strokeOpacity={0.3}
            />

            {/* --- PHYSICAL COOKIES PILED AT THE BOTTOM --- */}
            <G id="cookiesGroup">
              {/* Cookie 1 (Bottom Left) */}
              <G transform="translate(48, 162) rotate(-14)">
                <Circle cx="16" cy="16" r="15" fill="url(#cookieDough)" />
                {/* Chocolate chips */}
                <Circle cx="10" cy="11" r="2.3" fill="#3D1D03" />
                <Circle cx="19" cy="10" r="2.1" fill="#3D1D03" />
                <Circle cx="21" cy="19" r="2.4" fill="#3D1D03" />
                <Circle cx="11" cy="20" r="1.9" fill="#3D1D03" />
                <Circle cx="15" cy="16" r="2.2" fill="#3D1D03" />
              </G>

              {/* Cookie 2 (Bottom Right) */}
              <G transform="translate(116, 164) rotate(16)">
                <Circle cx="16" cy="16" r="15" fill="url(#cookieDough)" />
                <Circle cx="12" cy="11" r="2.3" fill="#3D1D03" />
                <Circle cx="21" cy="12" r="2.1" fill="#3D1D03" />
                <Circle cx="18" cy="20" r="2.2" fill="#3D1D03" />
                <Circle cx="9" cy="19" r="2.0" fill="#3D1D03" />
                <Circle cx="15" cy="16" r="2.2" fill="#3D1D03" />
              </G>

              {/* Cookie 3 (Middle Stack) */}
              {cookieCount >= 3 && (
                <G transform="translate(82, 146) rotate(4)">
                  <Circle cx="16" cy="16" r="15.5" fill="url(#cookieDough)" />
                  <Circle cx="11" cy="10" r="2.3" fill="#3D1D03" />
                  <Circle cx="20" cy="12" r="2.2" fill="#3D1D03" />
                  <Circle cx="19" cy="20" r="2.4" fill="#3D1D03" />
                  <Circle cx="10" cy="20" r="2.0" fill="#3D1D03" />
                  <Circle cx="15" cy="15" r="2.5" fill="#3D1D03" />
                </G>
              )}

              {/* Cookie 4 (Left Upper Stack) */}
              {cookieCount >= 4 && (
                <G transform="translate(54, 134) rotate(22)">
                  <Circle cx="14" cy="14" r="13.5" fill="url(#cookieDough)" />
                  <Circle cx="10" cy="9" r="2.0" fill="#3D1D03" />
                  <Circle cx="18" cy="11" r="2.1" fill="#3D1D03" />
                  <Circle cx="13" cy="17" r="2.2" fill="#3D1D03" />
                </G>
              )}

              {/* Cookie 5 (Right Upper Stack) */}
              {cookieCount >= 5 && (
                <G transform="translate(118, 136) rotate(-18)">
                  <Circle cx="14" cy="14" r="13.5" fill="url(#cookieDough)" />
                  <Circle cx="10" cy="11" r="2.0" fill="#3D1D03" />
                  <Circle cx="17" cy="10" r="2.1" fill="#3D1D03" />
                  <Circle cx="14" cy="17" r="2.2" fill="#3D1D03" />
                </G>
              )}

              {/* Cookie Crumbs ✨ */}
              <Circle cx="44" cy="192" r="2" fill="#E5A853" />
              <Circle cx="98" cy="196" r="1.6" fill="#C67D28" />
              <Circle cx="160" cy="193" r="2.2" fill="#E5A853" />
              <Circle cx="142" cy="155" r="1.2" fill="#FFC966" />
            </G>

            {/* --- GLASS SPECULAR LIGHT REFLECTION --- */}
            {/* Left curved shine streak */}
            <Path
              d="M 44 65 
                 C 40 95, 41 140, 48 180 
                 C 49 178, 51 140, 50 95 
                 C 50 75, 56 60, 64 50 
                 Z"
              fill="url(#glassSheen)"
            />

            {/* Right subtle shoulder highlight */}
            <Ellipse cx="162" cy="72" rx="3.5" ry="16" fill="#FFFFFF" fillOpacity={0.22} transform="rotate(18 162 72)" />
          </Svg>
        </View>

        {/* --- ARTISANAL KRAFT TAPE LABEL ON THE JAR BELLY --- */}
        <View style={styles.labelTape}>
          <LinearGradient
            colors={['#F9D368', '#F5BC38']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.labelTapeInner}
          >
            {/* Tape Header Tag */}
            <View style={styles.tapeTagRow}>
              <Text style={styles.tapeTagText}>🍪 SWEAR & COOKIE POT</Text>
            </View>

            {/* Animated Big Pot Total */}
            <View style={styles.totalRow}>
              <CountUp
                value={total}
                format={formatValue ?? ((n) => `£${Math.round(n)}`)}
                style={[styles.totalText, { fontSize: Math.round(36 * scale) }]}
                numberOfLines={1}
              />
            </View>

            {/* Weekly Count or Status */}
            <Text style={styles.statusSubText} numberOfLines={1}>
              {statusLabel.toUpperCase()}
            </Text>
          </LinearGradient>
        </View>

        {/* --- CAP PROGRESS INDICATOR AT BOTTOM OF THE TILE --- */}
        <View style={styles.bottomBarWrap}>
          <View style={styles.capTrack}>
            <LinearGradient
              colors={['#FFD15C', '#FF7A00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.capFill, { width: `${capProgress * 100}%` }]}
            />
          </View>
          <View style={styles.captionRow}>
            <Text style={styles.captionText}>
              {isMixed ? `+ ${moreCount} more jars` : 'Open the jar →'}
            </Text>
            <Text style={styles.capPercentText}>
              {Math.round(capProgress * 100)}% to feast
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(247, 200, 70, 0.45)',
    shadowColor: '#F7C846',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  pressable: {
    flex: 1,
    padding: spacing[3],
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ambientAura: {
    position: 'absolute',
    top: 30,
    left: 20,
    right: 20,
    bottom: 20,
    backgroundColor: '#FF9900',
    opacity: 0.08,
    borderRadius: 100,
  },
  jarSvgContainer: {
    position: 'absolute',
    top: 6,
    left: 8,
    right: 8,
    bottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelTape: {
    marginTop: 38,
    width: '88%',
    borderRadius: radius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
    transform: [{ rotate: '-1.5deg' }],
  },
  labelTapeInner: {
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  tapeTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 1,
  },
  tapeTagText: {
    fontFamily: 'Barlow-Bold',
    fontSize: 9,
    letterSpacing: 0.8,
    color: '#382506',
  },
  totalRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: -2,
  },
  totalText: {
    fontFamily: 'Barlow-Black',
    color: '#160D02',
    letterSpacing: -1.2,
    includeFontPadding: false,
  },
  statusSubText: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 9.5,
    letterSpacing: 0.6,
    color: '#4A330B',
    marginTop: 1,
  },
  bottomBarWrap: {
    width: '100%',
    marginTop: 'auto',
    paddingTop: 4,
  },
  capTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(247, 200, 70, 0.3)',
  },
  capFill: {
    height: '100%',
    borderRadius: 999,
  },
  captionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    paddingHorizontal: 2,
  },
  captionText: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 10.5,
    color: '#F7C846',
    letterSpacing: 0.3,
  },
  capPercentText: {
    fontFamily: 'Inter-Medium',
    fontSize: 9.5,
    color: 'rgba(255, 230, 160, 0.75)',
  },
});
