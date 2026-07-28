import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, CredRing, Button } from '../components';

// Peak — Cred rank up. Amber.
export function RankUpScreen({ navigation, route }: any) {
  const rank = route?.params?.rank ?? 'Sharp';
  const cred = route?.params?.cred ?? 850;
  const percentile = route?.params?.percentile ?? 85;

  return (
    <ScreenBackground tone="awaiting">
      <View style={styles.root}>
        <View style={styles.center}>
          <Text style={styles.overline}>YOU RANKED UP</Text>
          <CredRing percent={percentile} score={cred} size={168} strokeWidth={12} />
          <Text style={styles.rank}>{rank}</Text>
          <Text style={styles.sub}>Top {100 - percentile}% of callers. Your word carries weight.</Text>
        </View>
        <Button label="Keep calling it" onPress={() => navigation.popToTop?.() ?? navigation.navigate('Root')} fullWidth />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.screenGutter, paddingBottom: spacing[6] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  overline: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 12,
    letterSpacing: 3,
    color: colors.text.inverse,
    opacity: 0.7,
  },
  rank: {
    fontFamily: 'Barlow-Black',
    fontSize: 40,
    color: colors.text.inverse,
    letterSpacing: -0.5,
    marginTop: spacing[3],
  },
  sub: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.inverse,
    textAlign: 'center',
    maxWidth: 280,
    opacity: 0.85,
  },
});
