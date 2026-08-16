import React, { useState } from 'react';
import { Text, ScrollView, StyleSheet, Linking } from 'react-native';
import { colors, spacing } from '../tokens';
import { ActionSheet, ScreenBackground, NavHeader, SettingsRow, SettingsSection } from '../components';
import { useAuth } from '../lib/AuthContext';
import { getSettings, updateSettings } from '../api/settings';
import { useQuery } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';
import { links } from '../lib/links';

const CURRENCIES = ['GBP', 'USD', 'EUR', 'INR', 'AUD', 'CAD'];

export function SettingsScreen({ navigation }: any) {
  const [currencyOpen, setCurrencyOpen] = React.useState(false);
  const { signOut, demoMode } = useAuth();
  const { data: settings, refetch } = useQuery(getSettings, {
    auto_settle: false,
    currency: 'GBP',
    default_resolution: 'mutual',
    jar_cap_cents: 5000,
  } as any);
  const [pendingAutoSettle, setPendingAutoSettle] = useState<boolean | null>(null);
  const autoSettle = pendingAutoSettle ?? settings.auto_settle;

  const toggleAutoSettle = async (next: boolean) => {
    setPendingAutoSettle(next);
    if (!isBackendConfigured) return;
    try {
      await updateSettings({ auto_settle: next });
      refetch();
    } catch {
      setPendingAutoSettle(!next);
    }
  };

  const CURRENCY_LABEL: Record<string, string> = {
    GBP: 'GBP £', USD: 'USD $', EUR: 'EUR €', INR: 'INR ₹',
  };

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="back" title="Settings" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsSection title="Account">
          <SettingsRow icon="person" label="Profile" onPress={() => navigation.navigate('ProfileEdit')} />
          <SettingsRow icon="bell" label="Notifications" onPress={() => navigation.navigate('NotificationPrefs')} />
          <SettingsRow icon="lock" label="Privacy" onPress={() => navigation.navigate('Privacy')} />
          <SettingsRow icon="ban" label="Blocked users" onPress={() => navigation.navigate('BlockedUsers')} />
        </SettingsSection>

        <SettingsSection title="Bets & Ledger">
          <SettingsRow
            icon="scales"
            label="Default resolution"
            value={settings.default_resolution === 'group_vote' ? 'Group vote' : 'Mutual'}
            onPress={async () => {
              const next = settings.default_resolution === 'mutual' ? 'group_vote' : 'mutual';
              await updateSettings({ default_resolution: next });
              refetch();
            }}
          />
          {/* Tapping used to advance to the next currency in a hidden list of
              four, so choosing one meant tapping until it came round and you
              could not see what the options were. */}
          <SettingsRow
            icon="coin"
            label="Currency"
            value={CURRENCY_LABEL[settings.currency] ?? settings.currency}
            onPress={() => {
              setCurrencyOpen(true);
            }}
          />
          <SettingsRow
            icon="refresh"
            label="Auto-settle"
            toggle
            toggleValue={autoSettle}
            onToggle={toggleAutoSettle}
          />
        </SettingsSection>

        <SettingsSection title="Appearance">
          <SettingsRow icon="moon" label="Theme" value="Dark" showChevron={false} />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow icon="heart" label="Rate DeadRight" onPress={() => {}} />
          <SettingsRow icon="share" label="Share the app" onPress={() => {}} />
          {/* Both were no-ops. The App Store and Play both require a reachable
              privacy policy, and a dead row is worse than no row. */}
          <SettingsRow
            icon="doc"
            label="Privacy Policy"
            onPress={() => Linking.openURL(links.privacy)}
          />
          <SettingsRow
            icon="rules"
            label="Terms of Service"
            onPress={() => Linking.openURL(links.terms)}
          />
          <SettingsRow icon="info" label="Version" value="1.0.0" showChevron={false} />
        </SettingsSection>

        <SettingsSection title="Danger Zone">
          {!demoMode && (
            <SettingsRow icon="exit" label="Sign out" onPress={() => signOut()} />
          )}
          <SettingsRow
            icon="trash"
            label="Delete account"
            destructive
            onPress={() => navigation.navigate('DeleteAccount')}
          />
        </SettingsSection>

        <Text style={styles.footer}>DeadRight · Your word is your bond.</Text>
      </ScrollView>
      <ActionSheet
        visible={currencyOpen}
        title="Currency"
        options={CURRENCIES.map((code) => ({
          label: CURRENCY_LABEL[code] ?? code,
          primary: code === settings.currency,
          onPress: async () => {
            await updateSettings({ currency: code });
            refetch();
          },
        }))}
        onDismiss={() => setCurrencyOpen(false)}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.screenGutter,
    gap: spacing[5],
    paddingBottom: spacing[8],
  },
  footer: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing[2],
  },
});
