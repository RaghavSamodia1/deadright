import React from 'react';
import { View, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Ellipse } from 'react-native-svg';
import { colors } from '../../tokens';

const { width: W, height: H } = Dimensions.get('window');

export type BackgroundTone =
  | 'base' // navy — every regular screen
  | 'win' // mint — Called It Win peak
  | 'awaiting' // amber — Rank Up peak
  | 'dispute' // coral — Time's Up / dispute peaks
  | 'side-a' // violet — Bet Placed peak
  | 'flame'; // brand orange — onboarding slide 1 / streak peak

interface ScreenBackgroundProps {
  tone?: BackgroundTone;
  /** Soft radial glows top-right + bottom-left (off for plain screens) */
  glow?: boolean;
  children?: React.ReactNode;
  style?: ViewStyle;
}

const TONES: Record<BackgroundTone, { bg: string; glowColor: string }> = {
  base: { bg: colors.bg.base, glowColor: colors.side.a },
  win: { bg: colors.card.mint, glowColor: '#FFFFFF' },
  awaiting: { bg: colors.card.amber, glowColor: '#FFFFFF' },
  dispute: { bg: colors.card.coral, glowColor: '#FFD9D6' },
  'side-a': { bg: colors.card.violet, glowColor: '#C9C5FF' },
  flame: { bg: colors.brand.flame, glowColor: '#FFC9A8' },
};

/**
 * Full-bleed screen background. `base` for regular screens (subtle violet
 * glow adds the premium navy depth); bold tones for peak moments.
 */
export function ScreenBackground({ tone = 'base', glow = true, children, style }: ScreenBackgroundProps) {
  const t = TONES[tone];
  const glowOpacity = tone === 'base' ? 0.08 : 0.25;

  return (
    <View style={[styles.root, { backgroundColor: t.bg }, style]}>
      {glow && (
        <Svg width={W} height={H} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <RadialGradient id="glowTR" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={t.glowColor} stopOpacity={glowOpacity} />
              <Stop offset="100%" stopColor={t.glowColor} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="glowBL" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={t.glowColor} stopOpacity={glowOpacity * 0.6} />
              <Stop offset="100%" stopColor={t.glowColor} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={W * 0.9} cy={H * 0.08} rx={W * 0.7} ry={W * 0.7} fill="url(#glowTR)" />
          <Ellipse cx={W * 0.05} cy={H * 0.92} rx={W * 0.6} ry={W * 0.6} fill="url(#glowBL)" />
        </Svg>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
