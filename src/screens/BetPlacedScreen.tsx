import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, Stamp, Button } from '../components';

// Peak — bet published. Amber: the bet is now waiting on its deadline.
export function BetPlacedScreen({ navigation }: any) {
  return (
    <ScreenBackground tone="awaiting">
      <View style={styles.root}>
        <View style={styles.center}>
          <Text style={styles.emoji}></Text>
          <Stamp label="LOCKED IN" color={colors.text.inverse} rotate={-8} fontSize={48} />
          <Text style={styles.sub}>Your bet is live. The clock’s ticking — everyone’s been pinged.</Text>
        </View>
        <View style={styles.footer}>
          <Button label="Share the call" onPress={() => navigation.replace('ShareInvite')} variant="secondary" fullWidth />
          <Button label="Done" onPress={() => navigation.popToTop?.() ?? navigation.navigate('Root')} fullWidth />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.screenGutter, paddingBottom: spacing[6] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[5] },
  emoji: { fontSize: 80 },
  sub: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    maxWidth: 280,
    opacity: 0.92,
  },
  footer: { gap: spacing[3] },
});
