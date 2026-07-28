import React, { useState } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, SettingsRow, SettingsSection } from '../components';
import { useAuth } from '../lib/AuthContext';

export function SettingsScreen({ navigation }: any) {
  const [autoSettle, setAutoSettle] = useState(false);
  const { signOut, demoMode } = useAuth();

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="back" title="Settings" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsSection title="Account">
          <SettingsRow icon="👤" label="Profile" onPress={() => navigation.navigate('ProfileEdit')} />
          <SettingsRow icon="🔔" label="Notifications" onPress={() => navigation.navigate('NotificationPrefs')} />
          <SettingsRow icon="🔒" label="Privacy" onPress={() => navigation.navigate('Privacy')} />
          <SettingsRow icon="🚫" label="Blocked users" onPress={() => {}} />
        </SettingsSection>

        <SettingsSection title="Bets & Ledger">
          <SettingsRow icon="⚖️" label="Default resolution" value="Mutual" onPress={() => {}} />
          <SettingsRow icon="💷" label="Currency" value="GBP £" onPress={() => {}} />
          <SettingsRow
            icon="🔄"
            label="Auto-settle"
            toggle
            toggleValue={autoSettle}
            onToggle={setAutoSettle}
          />
          <SettingsRow icon="🍪" label="Cookie Jar defaults" value="Cap $50" onPress={() => navigation.navigate('JarRules')} />
        </SettingsSection>

        <SettingsSection title="Appearance">
          <SettingsRow icon="🌙" label="Theme" value="Dark" showChevron={false} />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsRow icon="❤️" label="Rate DeadRight" onPress={() => {}} />
          <SettingsRow icon="📤" label="Share the app" onPress={() => {}} />
          <SettingsRow icon="📄" label="Privacy Policy" onPress={() => {}} />
          <SettingsRow icon="📃" label="Terms of Service" onPress={() => {}} />
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
