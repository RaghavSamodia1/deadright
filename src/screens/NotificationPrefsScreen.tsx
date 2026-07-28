import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { spacing } from '../tokens';
import { ScreenBackground, NavHeader, SettingsRow, SettingsSection } from '../components';

export function NotificationPrefsScreen({ navigation }: any) {
  const [prefs, setPrefs] = useState({
    newBets: true,
    resolutions: true,
    disputes: true,
    jar: true,
    cred: false,
    marketing: false,
  });
  const set = (k: keyof typeof prefs) => (v: boolean) => setPrefs((p) => ({ ...p, [k]: v }));

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="back" title="Notifications" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <SettingsSection title="Bets">
          <SettingsRow icon="🎯" label="New bets you're in" toggle toggleValue={prefs.newBets} onToggle={set('newBets')} />
          <SettingsRow icon="⚖️" label="Resolutions & agreements" toggle toggleValue={prefs.resolutions} onToggle={set('resolutions')} />
          <SettingsRow icon="🔥" label="Disputes & votes" toggle toggleValue={prefs.disputes} onToggle={set('disputes')} />
        </SettingsSection>

        <SettingsSection title="Social">
          <SettingsRow icon="🍪" label="Cookie Jar activity" toggle toggleValue={prefs.jar} onToggle={set('jar')} />
          <SettingsRow icon="🏆" label="Cred & rank changes" toggle toggleValue={prefs.cred} onToggle={set('cred')} />
        </SettingsSection>

        <SettingsSection title="Other">
          <SettingsRow icon="📣" label="Product news" toggle toggleValue={prefs.marketing} onToggle={set('marketing')} />
        </SettingsSection>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[5], paddingBottom: spacing[8] },
});
