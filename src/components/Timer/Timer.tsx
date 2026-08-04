import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../tokens';

type TimerSize = 'lg' | 'md' | 'sm';

interface TimerProps {
  deadline: Date;
  size?: TimerSize;
  style?: TextStyle;
  onExpire?: () => void;
  /**
   * Fixed colour, for timers on a coloured card fill. The urgency palette
   * (mint / amber / coral) assumes a dark surface — mint on a mint win card is
   * 1.00:1 and the amber "warning" colour on an amber awaiting card is 1.00:1,
   * i.e. the countdown disappears exactly when it matters. Urgency stays
   * colour-coded on the dark cards, where the contrast holds.
   */
  ink?: string;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Ended';
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  // No seconds: a ticking seconds column drew the eye on every card in the
  // feed for information nobody acts on.
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}`;
  return `${minutes}m`;
}

function getTimerColor(ms: number): string {
  if (ms <= 0) return colors.text.tertiary;
  const minutes = ms / 60000;
  if (minutes <= 5) return colors.semantic.disputed; // coral — critical
  if (minutes <= 60) return colors.semantic.awaiting; // amber — warning
  return colors.semantic.live; // mint — normal
}

const SIZE_MAP: Record<TimerSize, { fontSize: number; lineHeight: number }> = {
  lg: { fontSize: 72, lineHeight: 80 },
  md: { fontSize: 36, lineHeight: 44 },
  sm: { fontSize: 20, lineHeight: 28 },
};

export function Timer({ deadline, size = 'sm', style, onExpire, ink }: TimerProps) {
  const [ms, setMs] = useState(() => deadline.getTime() - Date.now());
  const hapticsRef = { fiveMin: false, oneMin: false, thirtyS: false };

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = deadline.getTime() - Date.now();
      setMs(remaining);

      // Haptic alerts
      const mins = remaining / 60000;
      if (mins <= 5 && !hapticsRef.fiveMin) {
        hapticsRef.fiveMin = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else if (mins <= 1 && !hapticsRef.oneMin) {
        hapticsRef.oneMin = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else if (remaining <= 30000 && !hapticsRef.thirtyS) {
        hapticsRef.thirtyS = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }

      if (remaining <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  const expired = ms <= 0;
  const s = SIZE_MAP[size];
  // Expired reads as a label, not a countdown, so it drops to body size.
  const fontSize = expired ? Math.min(s.fontSize, 12) : s.fontSize;
  const lineHeight = expired ? 16 : s.lineHeight;
  const color = ink ?? getTimerColor(ms);

  return (
    <Text
      style={[
        styles.text,
        { fontSize, lineHeight, color, fontFamily: expired ? 'Inter-Regular' : 'SpaceMono-Bold' },
        style,
      ]}
    >
      {formatCountdown(ms)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'SpaceMono-Bold',
    includeFontPadding: false,
  },
});
