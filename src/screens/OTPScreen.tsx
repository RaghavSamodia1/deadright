import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, OTPInput, Button } from '../components';
import { verifyOtp, sendOtp, verifyEmailOtp, sendEmailOtp } from '../api/auth';
import { useAction } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';

export function OTPScreen({ navigation, route }: any) {
  // `phone` carries the email address too when method === 'email'.
  const target = route?.params?.phone ?? 'your phone';
  const isEmail = route?.params?.method === 'email';
  const [code, setCode] = useState('');

  const { run: verify, loading, error } = useAction(
    isEmail ? verifyEmailOtp : verifyOtp,
  );
  const { run: resend, loading: resending } = useAction(
    isEmail ? sendEmailOtp : sendOtp,
  );

  const submit = async (value: string) => {
    if (value.length < 6) return;
    // Demo mode: any 6 digits get you in.
    if (!isBackendConfigured) return navigation.replace('ProfileSetup');
    // No navigation on success: AuthProvider picks up the session and
    // RootNavigator swaps stacks (ProfileSetup for new users, Root otherwise).
    await verify(target, value);
  };

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="back" onBack={() => navigation.goBack()} />
      <View style={styles.root}>
        <View style={styles.body}>
          <Text style={styles.title}>Enter the code</Text>
          <Text style={styles.sub}>Sent to {target}</Text>
          <OTPInput onComplete={submit} onChangeText={setCode} hasError={!!error} />
          {error && <Text style={styles.error}>{error.message}</Text>}
          <Text
            style={styles.resend}
            onPress={() => (isBackendConfigured ? resend(target) : null)}
          >
            {resending ? 'Sending…' : 'Didn’t get it? Resend →'}
          </Text>
        </View>
        <Button
          label="Verify"
          onPress={() => submit(code)}
          disabled={code.length < 6}
          loading={loading}
          fullWidth
          style={styles.cta}
        />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.screenGutter },
  body: { flex: 1, gap: spacing[4], paddingTop: spacing[6], alignItems: 'center' },
  title: {
    fontFamily: 'Barlow-Black',
    fontSize: 30,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: spacing[4],
  },
  error: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.interactive.destructive,
    textAlign: 'center',
  },
  resend: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 13,
    color: colors.text.link,
    marginTop: spacing[4],
  },
  cta: { marginBottom: spacing[6] },
});
