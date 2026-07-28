import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, InviteCodeCard, Button } from '../components';

// Share / invite — group code, faux QR, share sheet trigger.
export function ShareInviteScreen({ navigation, route }: any) {
  const name = route?.params?.name ?? 'Sunday League';

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="modal" title="Invite" onBack={() => navigation.goBack()} />
      <View style={styles.root}>
        <Text style={styles.title}>Bring the group in</Text>
        <Text style={styles.sub}>Share the code or QR to add people to {name}.</Text>

        <InviteCodeCard code="ARS4TH" />

        {/* Faux QR */}
        <View style={styles.qr}>
          <View style={styles.qrGrid}>
            {Array.from({ length: 36 }).map((_, i) => (
              <View
                key={i}
                style={[styles.qrCell, { backgroundColor: (i * 7 + (i % 5)) % 3 === 0 ? colors.text.primary : 'transparent' }]}
              />
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Button label="Share link" onPress={() => { /* TODO: RN Share.share() */ }} fullWidth />
          <Button label="Done" onPress={() => navigation.goBack()} variant="ghost" fullWidth />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.screenGutter, gap: spacing[4], alignItems: 'center' },
  title: { fontFamily: 'Barlow-Black', fontSize: 26, color: colors.text.primary, marginTop: spacing[3] },
  sub: { fontFamily: 'Inter-Regular', fontSize: 14, color: colors.text.secondary, textAlign: 'center', maxWidth: 280 },
  qr: {
    backgroundColor: colors.bg.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing[5],
  },
  qrGrid: { width: 168, height: 168, flexDirection: 'row', flexWrap: 'wrap' },
  qrCell: { width: 28, height: 28 },
  footer: { alignSelf: 'stretch', gap: spacing[2], marginTop: 'auto', paddingBottom: spacing[4] },
});
