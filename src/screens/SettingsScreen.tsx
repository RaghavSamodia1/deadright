import React, { useState } from 'react';
import { Text, ScrollView, StyleSheet, Linking } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, SettingsRow, SettingsSection } from '../components';
import { useAuth } from '../lib/AuthContext';
import { getSettings, updateSettings } from '../api/settings';
import { useQuery } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';
import { links } from '../lib/links';

export function SettingsScreen({ navigation }: any) {
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
          <SettingsRow icon="👤" label="Profile" onPress={() => navigation.navigate('ProfileEdit')} />
          <SettingsRow icon="🔔" label="Notifications" onPress={() => navigation.navigate('NotificationPrefs')} />
          <SettingsRow icon="🔒" label="Privacy" onPress={() => navigation.navigate('Privacy')} />
          <SettingsRow icon="🚫" label="Blocked users" onPress={() => navigation.navigate('BlockedUsers')} />
        </SettingsSection>

        <SettingsSection title="Bets & Ledger">
          <SettingsRow
            icon="⚖️"
            label="Default resolution"
            value={settings.default_resolution === 'group_vote' ? 'Group vote' : 'Mutual'}
            onPress={async () => {
              const next = settings.default_resolution === 'mutual' ? 'group_vote' : 'mutual';
              await updateSettings({ default_resolution: next });
              refetch();
            }}
          />
          <SettingsRow
            icon="💷"
            label="Currency"
            value={CURRENCY_LABEL[settings.currency] ?? settings.currency}
            onPress={async () => {
              const order = ['GBP', 'USD', 'EUR', 'INR'];
              const next = order[(order.indexOf(settings.currency) + 1) % order.length];
              await updateSettings({ currency: next });
              refetch();
            }}
          />
          <SettingsRow
            icon="🔄"
            label="Auto-settle"
            toggle
            toggleValue={autoSettle}
            onToggle={toggleAutoSettle}
          />
          <SettingsRow
            icon="🍪"
            label="Cookie Jar defaults"
            value={`Cap $${(settings.jar_cap_cents / 100).toFixed(0)}`}
            onPress={() => navigation.navigate('JarRules')}
          />
        </SettingsSection>

        <SettingsSection title="Appearance">
          <SettingsRow icon="🌙" label="Theme" value="Dark" showChevron={false} />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow icon="❤️" label="Rate DeadRight" onPress={() => {}} />
          <SettingsRow icon="📤" label="Share the app" onPress={() => {}} />
          {/* Both were no-ops. The App Store and Play both require a reachable
              privacy policy, and a dead row is worse than no row. */}
          <SettingsRow
            icon="📄"
            label="Privacy Policy"
            onPress={() => Linking.openURL(links.privacy)}
          />
          <SettingsRow
            icon="📃"
            label="Terms of Service"
            onPress={() => Linking.openURL(links.terms)}
          />
          <SettingsRow icon="ℹ️" label="Version" value="1.0.0" showChevron={false} />
        </SettingsSection>

        <SettingsSection title="Danger Zone">
          {!demoMode && (
            <SettingsRow icon="🚪" label="Sign out" onPress={() => signOut()} />
          )}
          <SettingsRow
            icon="🗑️"
            label="Delete account"
            destructive
            onPress={() => navigation.navigate('DeleteAccount')}
          />
        </SettingsSection>

        <Text style={styles.footer}>DeadRight · Your word is your bond. 🔥</Text>
      </ScrollView>
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
