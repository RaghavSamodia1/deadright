import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../tokens';
import { ScreenBackground } from '../components';

// Splash — brand mark, auto-advances into onboarding/auth.
export function SplashScreen({ navigation }: any) {
  useEffect(() => {
    const t = setTimeout(() => navigation?.replace?.('Onboarding'), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <ScreenBackground tone="base">
      <View style={styles.center}>
        <Text style={styles.brand}>
          DeadRight
        </Text>
        <Text style={styles.tagline}>Your word is your bond.</Text>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  brand: {
    fontFamily: 'Barlow-Black',
    fontSize: 44,
    color: colors.brand.flame,
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text.tertiary,
  },
});
