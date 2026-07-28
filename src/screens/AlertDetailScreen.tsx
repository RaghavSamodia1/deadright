import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, Avatar, Button } from '../components';

export function AlertDetailScreen({ navigation }: any) {
  return (
    <ScreenBackground tone="base">
      <NavHeader variant="back" title="Alert" onBack={() => navigation.goBack()} />
      <View style={styles.root}>
        <View style={styles.card}>
          <Avatar size="lg" initials="MC" tint="a" />
          <Text style={styles.text}>@marcus called it: "Arsenal finish top 4 this season"</Text>
          <Text style={styles.meta}>Sunday League · 20 minutes ago</Text>
        </View>

        <View style={styles.detail}>
          <Text style={styles.q}>WHAT’S HAPPENING</Text>
          <Text style={styles.body}>
            Marcus opened a new call and put you on the invite. Pick a side before the deadline in 26h,
            or sit it out.
          </Text>
        </View>

        <View style={styles.footer}>
          <Button label="Pick your side" onPress={() => navigation.replace('SideSelection')} fullWidth />
          <Button label="View the bet" onPress={() => navigation.replace('BetDetail')} variant="secondary" fullWidth />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.screenGutter, gap: spacing[5] },
  card: {
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[6],
    marginTop: spacing[3],
  },
  text: { fontFamily: 'Barlow-Bold', fontSize: 17, lineHeight: 23, color: colors.text.primary, textAlign: 'center' },
  meta: { fontFamily: 'Inter-Regular', fontSize: 12, color: colors.text.tertiary },
  detail: { gap: spacing[2] },
  q: { fontFamily: 'Barlow-SemiBold', fontSize: 11, letterSpacing: 2, color: colors.semantic.awaiting },
  body: { fontFamily: 'Inter-Regular', fontSize: 15, lineHeight: 22, color: colors.text.secondary },
  footer: { gap: spacing[3], marginTop: 'auto', paddingBottom: spacing[4] },
});
