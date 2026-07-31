import React from 'react';
import { View, Text, Share, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors, radius, spacing } from '../tokens';
import { ScreenBackground, NavHeader, InviteCodeCard, Button } from '../components';
import { getMyGroups } from '../api/groups';
import { useQuery } from '../hooks/useQuery';

/**
 * Group invite. The 6-character code is how someone joins from another phone
 * (join_group_by_code), so it has to be the group's real code — a placeholder
 * here silently breaks the entire join flow.
 */
export function ShareInviteScreen({ navigation, route }: any) {
  const passedCode: string | undefined = route?.params?.code;
  const passedName: string | undefined = route?.params?.name;

  // Opened from Home or a bet without params: fall back to the first group.
  const { data: groups } = useQuery(
    async () => (passedCode ? [] : await getMyGroups()),
    [] as any[],
    [passedCode],
  );

  const code = passedCode ?? groups?.[0]?.invite_code ?? '——————';
  const name = passedName ?? groups?.[0]?.name ?? 'your group';
  const hasCode = code !== '——————';

  const share = () =>
    Share.share({
      message: `Join ${name} on DeadRight 🔥\n\nInvite code: ${code}\n\nOpen the app, tap "I have an invite code" and enter it.`,
    });

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="modal" title="Invite" onBack={() => navigation.goBack()} />
      <View style={styles.root}>
        <Text style={styles.title}>Bring the group in</Text>
        <Text style={styles.sub}>Share the code or scan the QR to join {name}.</Text>

        {hasCode ? (
          <>
            <InviteCodeCard code={code} />

            <View style={styles.qr}>
              <QRCode value={`deadright://join/${code}`} size={168} backgroundColor="#FFFFFF" color="#0A0A0B" />
            </View>
            <Text style={styles.qrHint}>Point a camera at this to join</Text>
          </>
        ) : (
          <Text style={styles.empty}>
            No group yet — create one first and its invite code appears here.
          </Text>
        )}

        <View style={styles.footer}>
          {hasCode && <Button label="Share invite" onPress={share} fullWidth />}
          <Button label="Done" onPress={() => navigation.goBack()} variant="ghost" fullWidth />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.screenGutter, gap: spacing[4], alignItems: 'center' },
  title: { fontFamily: 'Barlow-Black', fontSize: 26, color: colors.text.primary, marginTop: spacing[3] },
  sub: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  qr: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: 14,
  },
  qrHint: { fontFamily: 'Barlow-SemiBold', fontSize: 12, color: colors.text.tertiary },
  empty: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing[6],
  },
  footer: { alignSelf: 'stretch', gap: spacing[2], marginTop: 'auto', paddingBottom: spacing[4] },
});
