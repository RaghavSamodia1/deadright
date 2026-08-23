import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { radius as R } from '../../tokens';

interface GlassProps {
  /** Optional: Glass is also used as a bare backing layer behind content. */
  children?: React.ReactNode;
  /** Corner radius. Defaults to the app's card corner. */
  radius?: number;
  /** How frosted. Lower on Android, where blur costs more and looks worse. */
  intensity?: number;
  /** Warms or cools the panel — used for the tiles that carry meaning. */
  tint?: 'neutral' | 'warm' | 'cool' | 'hot';
  /**
   * An explicit wash colour, overriding `tint`. The soundboard gives every pad
   * its own hue, which a fixed four-value enum can't express.
   */
  fill?: string;
  /** Strength of the lit rim, 0–1. Dropped on surfaces that sit inside another. */
  rim?: number;
  /**
   * Blur what's behind. Off for panels that sit *on* another glass panel —
   * stacking BlurViews blurs an already-blurred image, which muddies the result
   * and costs a second full-surface pass on Android for nothing.
   */
  blur?: boolean;
  style?: StyleProp<ViewStyle>;
}

const FILL: Record<string, string> = {
  /**
   * No fill at all.
   *
   * This went white, then cool steel, then fainter, and every version was a
   * tint too many — a panel that announces itself as a lighter rectangle is
   * not glass, it is a card with a wash on it. What is left is the honest
   * version: the pane is defined by its lit edge, its sheen and its shadow,
   * and everything else is whatever is behind it. Text sits effectively on the
   * page, so contrast can only be better than it was.
   */
  neutral: 'transparent',
  warm: 'rgba(247,200,70,0.10)',
  cool: 'rgba(79,168,160,0.10)',
  hot: 'rgba(226,102,31,0.12)',
};

/**
 * A frosted panel.
 *
 * What sells glass is not the blur, it is the lit edge: real glass catches light
 * along its top rim and loses it by the bottom. RN cannot put a gradient on a
 * borderColor, so the rim is a gradient container with a single pixel of
 * padding, and the panel itself sits inside and masks everything but that ring.
 *
 * Android's blur is more expensive and lower quality than iOS's, so it runs
 * gentler there and leans on the tint instead.
 */
export function Glass({
  children,
  radius = R.lg,
  intensity = 26,
  tint = 'neutral',
  fill,
  rim = 1,
  blur = true,
  style,
}: GlassProps) {
  const inner = Math.max(0, radius - 1);
  const a = (v: number) => `rgba(255,255,255,${(v * rim).toFixed(3)})`;

  return (
    <LinearGradient
      colors={[a(0.55), a(0.14), a(0.03)]}
      locations={[0, 0.28, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={[{ borderRadius: radius, padding: 1 }, style]}
    >
      <View style={[styles.panel, { borderRadius: inner }]}>
        {blur && (
          <BlurView
            intensity={Platform.OS === 'android' ? Math.round(intensity * 0.55) : intensity}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: fill ?? FILL[tint] }]} />

        {/* The sheen.
            Glass reads as glass because of what it does to light, and until now
            these panels were relying entirely on blurring the background to do
            it — which stopped working when the atmosphere behind the app was
            turned down to almost nothing. A flat pane over a flat page is a
            translucent rectangle whatever you tint it.
            So the pane carries its own optics: a hard-edged specular band
            across the upper left, where a sheet of glass catches the light,
            fading out well before the middle. It is doing the job the backdrop
            blur cannot. */}
        <LinearGradient
          pointerEvents="none"
          colors={[
            'rgba(255,255,255,0.16)',
            'rgba(255,255,255,0.05)',
            'rgba(255,255,255,0)',
          ]}
          locations={[0, 0.18, 0.46]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Thickness. A pane has a bottom edge that sits in its own shadow;
            without it the panel floats with no sense of being a physical
            object at all. */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.18)']}
          locations={[0.72, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // flex:1 so the panel fills whether Glass wraps content or is laid in as
  // an absolute backing layer behind it.
  panel: { flex: 1, overflow: 'hidden', position: 'relative' },
});
