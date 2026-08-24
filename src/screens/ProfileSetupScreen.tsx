import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing } from '../tokens';
import {
  ScreenBackground,
  NavHeader,
  Avatar,
  TextInput,
  Button,
  SettingsRow,
  ActionSheet,
  PeepPicker,
} from '../components';
import { claimHandle } from '../api/auth';
import { updateProfile } from '../api/profile';
import { updateSettings } from '../api/settings';
import { CURRENCY_CODES, currencyLabel, deviceCurrency } from '../lib/money';
import { useAction } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { humanError } from '../lib/errors';

export function ProfileSetupScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  // Asked once, at signup. Everything used to land on formatMoney's GBP default,
  // so an account never told the app what it counts in.
  const [currency, setCurrency] = useState(deviceCurrency);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  // Held locally rather than written now: there is no profile row to attach it
  // to until claimHandle below creates one.
  const [avatar, setAvatar] = useState<string | null>(null);
  const [peepOpen, setPeepOpen] = useState(false);
  const ready = name.trim().length > 1 && handle.trim().length > 2;
  const { run: claim, loading, error } = useAction(claimHandle);
  const { refreshProfile } = useAuth();

  const finish = async () => {
    if (!isBackendConfigured) return navigation.replace('Root');
    const profile = await claim(handle, name);
    if (profile) {
      // Saved after the handle, because the settings row is keyed to the profile
      // this call creates. A failure here must not strand anyone outside the app —
      // the currency is editable in Settings, an unfinished signup is not.
      try {
        await updateSettings({ currency });
      } catch {
        // Non-fatal: they keep the default and can change it in Settings.
      }
      if (avatar) {
        try {
          await updateProfile({ avatar_url: avatar } as any);
        } catch {
          // Same reasoning: a picture is not worth blocking signup over, and
          // it can be set from the profile afterwards.
        }
      }
      refreshProfile(); // clears needsProfile so this screen isn't the entry point again
      navigation.replace('Root');
    }
  };

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="back" title="Set up profile" onBack={() => navigation.goBack()} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>
          <Pressable
            style={styles.avatarWrap}
            onPress={() => setPeepOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Pick a character"
          >
            <Avatar
              size="xl"
              initials={handle.slice(0, 2).toUpperCase() || '??'}
              uri={avatar ?? undefined}
              seed={handle}
            />
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>＋</Text>
            </View>
          </Pressable>
          <Text style={styles.pickHint}>Pick a character</Text>

          <TextInput label="Display name" placeholder="Your name" value={name} onChangeText={setName} />
          <TextInput
            label="Handle"
            placeholder="yourhandle"
            value={handle}
            onChangeText={(t) => setHandle(t.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
            autoCapitalize="none"
            helper="This is how friends find and call you out."
            error={error ? humanError(error) : undefined}
          />

          <SettingsRow
            icon="coin"
            label="Currency"
            value={currencyLabel(currency)}
            onPress={() => setCurrencyOpen(true)}
          />
          <Text style={styles.helper}>
            What your bets and jars are counted in. Each group can set its own later —
            so everyone in a group reads the same figures.
          </Text>
        </View>
        <Button
          label="Start keeping score"
          onPress={finish}
          disabled={!ready}
          loading={loading}
          fullWidth
          style={styles.cta}
        />
      </ScrollView>

      <ActionSheet
        visible={currencyOpen}
        title="Currency"
        options={CURRENCY_CODES.map((code) => ({
          label: currencyLabel(code),
          primary: code === currency,
          onPress: () => setCurrency(code),
        }))}
        onDismiss={() => setCurrencyOpen(false)}
      />
      <PeepPicker
        visible={peepOpen}
        current={avatar}
        onPick={setAvatar}
        onDismiss={() => setPeepOpen(false)}
      />
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
  body: { gap: spacing[4], paddingTop: spacing[5] },
  avatarWrap: { alignSelf: 'center' },
  pickHint: {
    fontFamily: 'Barlow-SemiBold',
    fontSize: 13,
    color: colors.text.link,
    alignSelf: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[4],
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.interactive.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg.base,
  },
  badgeIcon: { fontSize: 16, color: colors.text.inverse, fontWeight: '700' },
  helper: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 16,
    color: colors.text.tertiary,
  },
  cta: { marginBottom: spacing[6] },
});
