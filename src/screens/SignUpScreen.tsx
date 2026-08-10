import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, TextInput, Button, SegmentedControl } from '../components';
import { sendOtp, sendEmailOtp, signInOrSignUp } from '../api/auth';
import { useAction } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';
import { links } from '../lib/links';
import { humanError } from '../lib/errors';

type Method = 'phone' | 'email';

/**
 * Sign up by phone or email, both via a one-time code (Supabase signInWithOtp).
 * Phone needs an SMS provider configured on the project; email works out of the
 * box, so it's the fallback when SMS isn't set up.
 */
export function SignUpScreen({ navigation }: any) {
  const [method, setMethod] = useState<Method>('email');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { run: sendPhone, loading: sendingPhone, error: phoneError } = useAction(sendOtp);
  const { run: emailAuth, loading: authing, error: emailError } = useAction(signInOrSignUp);
  const { run: mailCode, loading: mailingCode } = useAction(sendEmailOtp);

  // Set when the address already has an account this password doesn't open —
  // usually one created by code before password auth existed, so there is no
  // password to get right. Offers the way in that does work.
  const stuck = emailError ? /wrong_password/.test(String(emailError.message)) : false;

  const isEmail = method === 'email';
  const valid = isEmail
    ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()) && password.length >= 6
    : phone.replace(/\D/g, '').length >= 10;
  const loading = isEmail ? authing : sendingPhone;
  const error = isEmail ? emailError : phoneError;

  const onSubmit = async () => {
    // Demo mode (no backend): skip straight through.
    if (!isBackendConfigured) {
      return isEmail
        ? navigation.replace('ProfileSetup')
        : navigation.navigate('OTP', { phone, method });
    }
    if (isEmail) {
      // Password auth signs in immediately — no email round-trip to wait on.
      // No navigation here on purpose: AuthProvider sees the new session and
      // RootNavigator swaps to the app stack (ProfileSetup for new users).
      await emailAuth(email, password);
      return;
    }
    const ok = await sendPhone(phone);
    if (ok !== null) navigation.navigate('OTP', { phone, method });
  };

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="modal" onBack={() => navigation.goBack()} />
      {/* A ScrollView rather than KeyboardAvoidingView. With behavior="padding"
          the keyboard shrank this view while `body` kept flex:1, so its content
          overflowed the box and painted straight over the footer — the password
          field landed on top of the Continue button. Scrolling lets the content
          keep its height, and automaticallyAdjustKeyboardInsets does the
          keyboard inset natively (Android has adjustResize in the manifest). */}
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          <Text style={styles.title}>
            {isEmail ? 'What’s your email?' : 'What’s your number?'}
          </Text>
          <Text style={styles.sub}>
            {isEmail
              ? 'New here? This creates your account. Already have one? It signs you in.'
              : 'We’ll text a 6-digit code to verify it’s you. No spam, ever.'}
          </Text>

          <SegmentedControl
            segments={[
              { value: 'email' as Method, label: 'Email' },
              { value: 'phone' as Method, label: 'Phone' },
            ]}
            value={method}
            onChange={setMethod}
          />

          {isEmail ? (
            <>
              <TextInput
                label="Email"
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
                autoFocus
              />
              <TextInput
                label="Password"
                placeholder="At least 6 characters"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
                error={error ? humanError(error) : undefined}
              />
            </>
          ) : (
            <TextInput
              label="Phone"
              placeholder="+44 7700 900000"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoFocus
              error={error ? humanError(error) : undefined}
              helper="Needs an SMS provider on the project."
            />
          )}
        </View>

        <View style={styles.footer}>
          <Button
            label={isEmail ? 'Continue' : 'Send code'}
            onPress={onSubmit}
            disabled={!valid}
            loading={loading}
            fullWidth
          />
          {stuck && (
            <Button
              label={mailingCode ? 'Sending…' : 'Email me a code instead'}
              variant="secondary"
              fullWidth
              onPress={async () => {
                const ok = await mailCode(email.trim().toLowerCase());
                if (ok !== null) {
                  navigation.navigate('OTP', { phone: email.trim().toLowerCase(), method: 'email' });
                }
              }}
            />
          )}
          <Text style={styles.legal}>
            By continuing you agree to our{' '}
            <Text style={styles.legalLink} onPress={() => Linking.openURL(links.terms)}>
              Terms
            </Text>
            {' '}&amp;{' '}
            <Text style={styles.legalLink} onPress={() => Linking.openURL(links.privacy)}>
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: spacing.screenGutter,
  },
  body: { gap: spacing[4], paddingTop: spacing[6] },
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
    marginBottom: spacing[2],
  },
  footer: { gap: spacing[3], paddingTop: spacing[6], paddingBottom: spacing[6] },
  legalLink: {
    color: colors.text.link,
    textDecorationLine: 'underline',
  },
  legal: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
