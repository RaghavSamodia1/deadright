import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, SettingsRow, SettingsSection } from '../components';
import { getSettings, updateSettings, type UserSettings } from '../api/settings';
import { useQuery } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';

const DEFAULTS = {
  private_profile: false,
  show_ledger: true,
  discoverable: true,
} as UserSettings;

export function PrivacyScreen({ navigation }: any) {
  const { data: settings, refetch } = useQuery(getSettings, DEFAULTS);
  const [pending, setPending] = React.useState<Partial<UserSettings>>({});

  const value = (key: keyof UserSettings) =>
    (pending[key] as boolean) ?? (settings[key] as boolean);

  const set = (key: keyof UserSettings) => async (next: boolean) => {
    setPending((p) => ({ ...p, [key]: next }));
    if (!isBackendConfigured) return;
    try {
      await updateSettings({ [key]: next } as Partial<UserSettings>);
      refetch();
    } catch {
      setPending((p) => ({ ...p, [key]: !next }));
    }
  };

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="back" title="Privacy" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <SettingsSection title="Visibility">
          <SettingsRow icon="lock" label="Private profile" toggle toggleValue={value('private_profile')} onToggle={set('private_profile')} />
          <SettingsRow icon="ledger" label="Show my ledger to groups" toggle toggleValue={value('show_ledger')} onToggle={set('show_ledger')} />
          <SettingsRow icon="search" label="Discoverable by handle" toggle toggleValue={value('discoverable')} onToggle={set('discoverable')} />
        </SettingsSection>

        <SettingsSection title="Safety">
          <SettingsRow icon="ban" label="Blocked users" onPress={() => navigation.navigate('BlockedUsers')} />
        </SettingsSection>

        <Text style={styles.note}>
          A private profile hides your Cred and history from people outside your groups.
          Group members always see the bets you share with them.
        </Text>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[5], paddingBottom: spacing[8] },
  note: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    lineHeight: 16,
    color: colors.text.tertiary,
  },
});
