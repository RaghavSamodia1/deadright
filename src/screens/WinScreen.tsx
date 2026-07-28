import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, Stamp, Button } from '../components';

// Peak — "CALLED IT" win moment. Mint, rotated stamp (the signature moment).
export function WinScreen({ navigation, route }: any) {
  const cred = route?.params?.credGain ?? 12;

  return (
    <ScreenBackground tone="win">
      <View style={styles.root}>
        <View style={styles.center}>
          <Stamp label="CALLED IT" color={colors.text.inverse} rotate={-12} fontSize={60} />
          <Text style={styles.emoji}>🔥</Text>
          <Text style={styles.sub}>You were dead right.</Text>
          <View style={styles.credPill}>
            <Text style={styles.credText}>+{cred} Cred</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Button label="Rub it in 😏" onPress={() => navigation.replace('ShareInvite')} variant="secondary" fullWidth />
          <Button label="Nice" onPress={() => navigation.popToTop?.() ?? navigation.navigate('Root')} fullWidth />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.screenGutter, paddingBottom: spacing[6] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[4] },
  emoji: { fontSize: 56, marginTop: spacing[4] },
  sub: {
    fontFamily: 'Barlow-Bold',
    fontSize: 20,
    color: colors.text.inverse,
  },
  credPill: {
    backgroundColor: colors.text.inverse,
    borderRadius: 999,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[2],
    marginTop: spacing[2],
  },
  credText: {
    fontFamily: 'Barlow-Black',
    fontSize: 16,
    color: colors.semantic.win,
    letterSpacing: 0.5,
  },
  footer: { gap: spacing[3] },
});
