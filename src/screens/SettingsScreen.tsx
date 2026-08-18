import React, { useState } from 'react';
// The picker was a hardcoded six that had drifted from the symbol table it
// renders through, so adding a currency meant remembering two places.
import { CURRENCY_CODES, currencyLabel } from '../lib/money';
import { resetMyLedger } from '../api/ledger';
import { plural } from '../lib/plural';
import { Text, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import { colors, spacing } from '../tokens';
import { ActionSheet, ScreenBackground, NavHeader, SettingsRow, SettingsSection } from '../components';
import { useAuth } from '../lib/AuthContext';
import { getSettings, updateSettings } from '../api/settings';
import { useQuery } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';
import { links } from '../lib/links';


/**
 * 'judge' is deliberately absent. bets has a `judge_required` constraint — a
 * judge-resolved bet must name a judge — and nothing in bet creation asks for
 * one, so defaulting to it would make every new bet fail to insert. It stays a
 * per-bet choice until there is a judge picker.
 */
const RESOLUTION_METHODS: { code: 'mutual' | 'group_vote'; label: string }[] = [
  { code: 'mutual', label: 'Mutual — both sides agree' },
  { code: 'group_vote', label: 'Group vote — the group decides' },
];

const RESOLUTION_LABEL: Record<string, string> = {
  mutual: 'Mutual',
  group_vote: 'Group vote',
  judge: 'Judge',
};

export function SettingsScreen({ navigation }: any) {
  const [currencyOpen, setCurrencyOpen] = React.useState(false);
  const [resolutionOpen, setResolutionOpen] = React.useState(false);
  const [resetting, setResetting] = React.useState(false);

  // The ledger is shared: deleting your entries removes them from the other
  // person's ledger too, and they get told. Say that plainly before doing it.
  const confirmReset = () => {
    Alert.alert(
      'Reset your ledger?',
      'This permanently deletes every entry you\u2019re part of. Because entries are ' +
        'shared, they disappear from the other person\u2019s ledger as well, and ' +
        'everyone affected gets a notification. Jar violations stay on record. ' +
        'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset it',
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            try {
              const removed = await resetMyLedger();
              Alert.alert(
                'Ledger reset',
                removed > 0
                  ? `Removed ${plural(removed, 'entry', 'entries')}. Anyone who shared them has been notified.`
                  : 'There was nothing left to remove.',
              );
            } catch (e: any) {
              Alert.alert('Couldn\u2019t reset the ledger', e?.message ?? 'Something went wrong.');
            } finally {
              setResetting(false);
            }
          },
        },
      ],
    );
  };
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
          {/* Same problem the currency row had: tapping cycled between two of
              the three methods, so the options were invisible and 'judge' was
              unreachable. A menu shows what there is. */}
          <SettingsRow
            icon="scales"
            label="Default resolution"
            value={RESOLUTION_LABEL[settings.default_resolution] ?? 'Mutual'}
            onPress={() => setResolutionOpen(true)}
          />
          {/* Tapping used to advance to the next currency in a hidden list of
              four, so choosing one meant tapping until it came round and you
              could not see what the options were. */}
          {/* Only a default now: the currency each group's money is read in
              lives on the group, so members can't disagree about the unit. */}
          <SettingsRow
            icon="coin"
            label="Default currency"
            value={currencyLabel(settings.currency)}
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
          {/* Two taps to wipe shared records: the first names what it will do to
              other people, the second is the one that does it. */}
          <SettingsRow
            icon="ledger"
            label={resetting ? 'Resetting…' : 'Reset ledger'}
            destructive
            onPress={confirmReset}
          />
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
        visible={resolutionOpen}
        title="Default resolution"
        options={RESOLUTION_METHODS.map(({ code, label }) => ({
          label,
          primary: code === settings.default_resolution,
          onPress: async () => {
            await updateSettings({ default_resolution: code });
            refetch();
          },
        }))}
        onDismiss={() => setResolutionOpen(false)}
      />
      <ActionSheet
        visible={currencyOpen}
        title="Currency"
        options={CURRENCY_CODES.map((code) => ({
          label: currencyLabel(code),
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
