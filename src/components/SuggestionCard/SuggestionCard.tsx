import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../../tokens';
import { Button } from '../Button/Button';

interface SuggestionCardProps {
  /** The AI-sharpened text */
  suggestion: string;
  onAccept: () => void;
  onReject: () => void;
  /** Shimmer/loading state while the LLM call runs */
  loading?: boolean;
  style?: ViewStyle;
}

/**
 * AI Sharpen suggestion (Create flow §4b). Suggestion, never substitution:
 * the user's original is never overwritten without a tap. Accepting shows
 * a 5s undo toast (caller's responsibility).
 */
export function SuggestionCard({ suggestion, onAccept, onReject, loading = false, style }: SuggestionCardProps) {
  return (
    <View style={[styles.card, loading && { opacity: 0.6 }, style]}>
      {/* The amber ring stays: it is what marks this text as the machine's
          suggestion rather than something the user wrote. */}
      <Text style={styles.overline}>SUGGESTED</Text>
      <Text style={styles.text}>"{suggestion}"</Text>
      <View style={styles.actions}>
        <Button label="Use this" onPress={onAccept} size="sm" disabled={loading} />
        <Button label="Keep mine" onPress={onReject} size="sm" variant="secondary" disabled={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface2,
    overflow: 'hidden',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(247,200,70,0.5)',
    padding: spacing[4],
    gap: spacing[3],
  },
  overline: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 11,
    letterSpacing: 2,
    color: colors.semantic.awaiting,
  },
  text: {
    fontFamily: 'Barlow-Bold',
    fontSize: 15,
    lineHeight: 21,
    color: colors.text.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
});
