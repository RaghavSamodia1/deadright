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
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getTimerColor(ms: number): string {
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

export function Timer({ deadline, size = 'sm', style, onExpire }: TimerProps) {
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

  const s = SIZE_MAP[size];
  const color = getTimerColor(ms);

  return (
    <Text
      style={[
        styles.text,
        { fontSize: s.fontSize, lineHeight: s.lineHeight, color },
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
