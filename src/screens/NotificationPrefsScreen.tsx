import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, SettingsRow, SettingsSection } from '../components';
import { getSettings, updateSettings, type UserSettings } from '../api/settings';
import { useQuery } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';
import { humanError } from '../lib/errors';

const DEFAULTS = {
  notify_new_bets: true,
  notify_resolutions: true,
  notify_disputes: true,
  notify_jar: true,
  notify_form: false,
  notify_marketing: false,
} as UserSettings;

/** Each toggle writes immediately — there's no Save button to forget to press. */
export function NotificationPrefsScreen({ navigation }: any) {
  const { data: settings, refetch, error } = useQuery(getSettings, DEFAULTS);
  const [pending, setPending] = React.useState<Partial<UserSettings>>({});

  const value = (key: keyof UserSettings) =>
    (pending[key] as boolean) ?? (settings[key] as boolean);

  const set = (key: keyof UserSettings) => async (next: boolean) => {
    // Optimistic: the switch moves now, the write follows.
    setPending((p) => ({ ...p, [key]: next }));
    if (!isBackendConfigured) return;
    try {
      await updateSettings({ [key]: next } as Partial<UserSettings>);
      refetch();
    } catch {
      setPending((p) => ({ ...p, [key]: !next })); // roll back on failure
    }
  };

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="back" title="Notifications" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {error && <Text style={styles.error}>Couldn’t load settings: {humanError(error)}</Text>}

        <SettingsSection title="Bets">
          <SettingsRow icon="target" label="New bets you're in" toggle toggleValue={value('notify_new_bets')} onToggle={set('notify_new_bets')} />
          <SettingsRow icon="scales" label="Resolutions & agreements" toggle toggleValue={value('notify_resolutions')} onToggle={set('notify_resolutions')} />
          <SettingsRow icon="flame" label="Disputes & votes" toggle toggleValue={value('notify_disputes')} onToggle={set('notify_disputes')} />
        </SettingsSection>

        <SettingsSection title="Social">
          <SettingsRow icon="jar" label="Cookie Jar activity" toggle toggleValue={value('notify_jar')} onToggle={set('notify_jar')} />
          <SettingsRow icon="trophy" label="Form & rank changes" toggle toggleValue={value('notify_form')} onToggle={set('notify_form')} />
        </SettingsSection>

        <SettingsSection title="Other">
          <SettingsRow icon="megaphone" label="Product news" toggle toggleValue={value('notify_marketing')} onToggle={set('notify_marketing')} />
        </SettingsSection>

        <Text style={styles.note}>
          Saved as you change them. Push delivery needs notification permission on the device.
        </Text>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[5], paddingBottom: spacing[8] },
  note: { fontFamily: 'Inter-Regular', fontSize: 11, color: colors.text.tertiary },
  error: { fontFamily: 'Inter-Regular', fontSize: 13, color: colors.interactive.destructive },
});
