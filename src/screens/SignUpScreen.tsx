import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, TextInput, Button } from '../components';
import { sendOtp } from '../api/auth';
import { useAction } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';

// Phone-first sign up → OTP. (Supabase auth: signInWithOtp)
export function SignUpScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const valid = phone.replace(/\D/g, '').length >= 10;
  const { run: send, loading, error } = useAction(sendOtp);

  const onSubmit = async () => {
    // Demo mode (no backend): skip straight to the code screen.
    if (!isBackendConfigured) return navigation.navigate('OTP', { phone });
    const ok = await send(phone);
    if (ok !== null) navigation.navigate('OTP', { phone });
  };

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="modal" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}
      >
        <View style={styles.body}>
          <Text style={styles.title}>What’s your number?</Text>
          <Text style={styles.sub}>We’ll text a code to verify it’s you. No spam, ever.</Text>
          <TextInput
            label="Phone"
            placeholder="+44 7700 900000"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            autoFocus
            error={error ? error.message : undefined}
          />
        </View>
        <View style={styles.footer}>
          <Button
            label="Send code"
            onPress={onSubmit}
            disabled={!valid}
            loading={loading}
            fullWidth
          />
          <Text style={styles.legal}>
            By continuing you agree to our Terms & Privacy Policy.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.screenGutter },
  body: { flex: 1, gap: spacing[4], paddingTop: spacing[6] },
  title: {
    fontFamily: 'Barlow-Black',
    fontSize: 30,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  sub: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.secondary,
    marginBottom: spacing[3],
  },
  footer: { gap: spacing[3], paddingBottom: spacing[6] },
  legal: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
