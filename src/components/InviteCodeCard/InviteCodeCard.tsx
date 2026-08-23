import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { colors, radius, spacing } from '../../tokens';

interface InviteCodeCardProps {
  code: string; // 6-char group invite code
  hint?: string;
  onCopied?: () => void;
  style?: ViewStyle;
}

/**
 * Gate-board style code display (Sinport bag-drop counter aesthetic).
 * Big amber Barlow Black monogram, tap-to-copy.
 */
export function InviteCodeCard({
  code,
  hint = 'Anyone with this code can join',
  onCopied,
  style,
}: InviteCodeCardProps) {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCopied?.();
  };

  return (
    <Pressable
      onPress={handleCopy}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }, style]}
      accessibilityRole="button"
      accessibilityLabel={`Invite code ${code.split('').join(' ')}. Tap to copy.`}
    >
      <Text style={styles.overline}>INVITE CODE</Text>
      <View style={styles.codeRow}>
        {code.toUpperCase().split('').map((ch, i) => (
          <View key={i} style={styles.cell}>
            <Text style={styles.char}>{ch}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.hint}>{hint} · Tap to copy</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface2,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    overflow: 'hidden',
    padding: spacing[6],
    alignItems: 'center',
    gap: spacing[3],
  },
  overline: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
  },
  codeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  cell: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.xs,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 40,
    alignItems: 'center',
  },
  char: {
    fontFamily: 'Barlow-Black',
    fontSize: 36,
    color: colors.semantic.awaiting,
    includeFontPadding: false,
  },
  hint: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.text.tertiary,
  },
});
