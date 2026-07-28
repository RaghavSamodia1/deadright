import React, { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { spacing } from '../tokens';
import { ScreenBackground, NavHeader, SettingsRow, SettingsSection } from '../components';

export function PrivacyScreen({ navigation }: any) {
  const [privateProfile, setPrivateProfile] = useState(false);
  const [showLedger, setShowLedger] = useState(true);
  const [discoverable, setDiscoverable] = useState(true);

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="back" title="Privacy" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <SettingsSection title="Visibility">
          <SettingsRow icon="🔒" label="Private profile" toggle toggleValue={privateProfile} onToggle={setPrivateProfile} />
          <SettingsRow icon="📒" label="Show my ledger to groups" toggle toggleValue={showLedger} onToggle={setShowLedger} />
          <SettingsRow icon="🔍" label="Discoverable by handle" toggle toggleValue={discoverable} onToggle={setDiscoverable} />
        </SettingsSection>

        <SettingsSection title="Who can">
          <SettingsRow icon="🎯" label="Bet me" value="Friends" onPress={() => {}} />
          <SettingsRow icon="👥" label="Add me to groups" value="Anyone" onPress={() => {}} />
        </SettingsSection>

        <SettingsSection title="Safety">
          <SettingsRow icon="🚫" label="Blocked users" onPress={() => navigation.navigate('BlockedUsers')} />
          <SettingsRow icon="⬇️" label="Download my data" onPress={() => {}} />
        </SettingsSection>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[5], paddingBottom: spacing[8] },
});
