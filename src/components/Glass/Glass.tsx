import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
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
  style?: ViewStyle;
}

const FILL: Record<string, string> = {
  neutral: 'rgba(255,255,255,0.05)',
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
  style,
}: GlassProps) {
  const inner = Math.max(0, radius - 1);

  return (
    <LinearGradient
      colors={[
        'rgba(255,255,255,0.30)',
        'rgba(255,255,255,0.07)',
        'rgba(255,255,255,0.02)',
      ]}
      locations={[0, 0.4, 1]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.7, y: 1 }}
      style={[{ borderRadius: radius, padding: 1 }, style]}
    >
      <View style={[styles.panel, { borderRadius: inner }]}>
        <BlurView
          intensity={Platform.OS === 'android' ? Math.round(intensity * 0.55) : intensity}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: FILL[tint] }]} />
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
