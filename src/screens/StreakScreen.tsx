import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../components';
import { colors, spacing } from '../tokens';
import { ScreenBackground, Button } from '../components';

// The flame background is bright: navy text clears 5.85:1 where off-white
// managed only 2.81:1.

// Peak — win streak milestone. Flame orange.
export function StreakScreen({ navigation, route }: any) {
  const streak = route?.params?.streak ?? 5;

  return (
    <ScreenBackground tone="flame">
      <View style={styles.root}>
        <View style={styles.center}>
          <Icon name="flame" size={88} color={colors.brand.flame} strokeWidth={1.8} />
          <Text style={styles.count}>{streak}×</Text>
          <Text style={styles.title}>On a heater</Text>
          <Text style={styles.sub}>{streak} calls right in a row. Don’t quit while you’re ahead.</Text>
        </View>
        <Button label="Ride it" onPress={() => navigation.popToTop?.() ?? navigation.navigate('Root')} variant="secondary" fullWidth />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.screenGutter, paddingBottom: spacing[6] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[2] },
  count: {
    fontFamily: 'Barlow-Black',
    fontSize: 72,
    color: colors.text.inverse,
    letterSpacing: -2,
  },
  title: {
    fontFamily: 'Barlow-Bold',
    fontSize: 24,
    color: colors.text.inverse,
  },
  sub: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.inverse,
    textAlign: 'center',
    maxWidth: 280,
    opacity: 0.9,
    marginTop: spacing[2],
  },
});
