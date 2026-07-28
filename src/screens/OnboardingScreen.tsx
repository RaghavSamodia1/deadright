import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, ProgressDots, Button } from '../components';

const SLIDES = [
  { emoji: '🎯', title: 'Call it now.', body: 'Bet you won’t. I’m calling it. Capture the moment before it happens.' },
  { emoji: '⚖️', title: 'Settle it fair.', body: 'When the dust settles, both sides agree who was right. Disputes go to a group vote.' },
  { emoji: '🏆', title: 'Build your Cred.', body: 'Every call you nail builds your reputation. No money — your word is the stake.' },
];

export function OnboardingScreen({ navigation }: any) {
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;
  const slide = SLIDES[i];

  return (
    <ScreenBackground tone="base">
      <View style={styles.root}>
        <Text style={styles.skip} onPress={() => navigation.replace('SignUp')}>
          Skip
        </Text>

        <View style={styles.body}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.text}>{slide.body}</Text>
        </View>

        <View style={styles.footer}>
          <ProgressDots total={SLIDES.length} current={i} />
          <Button
            label={last ? 'Get started' : 'Next'}
            onPress={() => (last ? navigation.replace('SignUp') : setI(i + 1))}
            fullWidth
          />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.screenGutter, paddingTop: spacing[11] },
  skip: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'right',
  },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[4] },
  emoji: { fontSize: 72 },
  title: {
    fontFamily: 'Barlow-Black',
    fontSize: 34,
    color: colors.text.primary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  text: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 300,
  },
  footer: { gap: spacing[5], paddingBottom: spacing[6], alignItems: 'center' },
});
