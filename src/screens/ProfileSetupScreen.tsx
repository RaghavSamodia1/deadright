import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, Avatar, TextInput, Button } from '../components';
import { claimHandle } from '../api/auth';
import { useAction } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

export function ProfileSetupScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const ready = name.trim().length > 1 && handle.trim().length > 2;
  const { run: claim, loading, error } = useAction(claimHandle);
  const { refreshProfile } = useAuth();

  const finish = async () => {
    if (!isBackendConfigured) return navigation.replace('Root');
    const profile = await claim(handle, name);
    if (profile) {
      refreshProfile(); // clears needsProfile so this screen isn't the entry point again
      navigation.replace('Root');
    }
  };

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader variant="back" title="Set up profile" onBack={() => navigation.goBack()} />
      <View style={styles.root}>
        <View style={styles.body}>
          <Pressable style={styles.avatarWrap} accessibilityLabel="Add photo">
            <Avatar size="xl" initials={handle.slice(0, 2).toUpperCase() || '🙂'} tint="a" />
            <View style={styles.badge}>
              <Text style={styles.badgeIcon}>＋</Text>
            </View>
          </Pressable>

          <TextInput label="Display name" placeholder="Raghav S" value={name} onChangeText={setName} />
          <TextInput
            label="Handle"
            placeholder="raghav"
            value={handle}
            onChangeText={(t) => setHandle(t.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
            autoCapitalize="none"
            helper="This is how friends find and call you out."
            error={error ? error.message : undefined}
          />
        </View>
        <Button
          label="Start calling it"
          onPress={finish}
          disabled={!ready}
          loading={loading}
          fullWidth
          style={styles.cta}
        />
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.screenGutter },
  body: { flex: 1, gap: spacing[4], paddingTop: spacing[5] },
  avatarWrap: { alignSelf: 'center', marginBottom: spacing[4] },
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
  cta: { marginBottom: spacing[6] },
});
