import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors, spacing } from '../tokens';
import { ScreenBackground, NavHeader, Avatar, TextInput, Button } from '../components';
import { getMyProfile, updateProfile } from '../api/profile';
import { useQuery, useAction } from '../hooks/useQuery';
import { isBackendConfigured } from '../lib/supabase';

export function ProfileEditScreen({ navigation }: any) {
  const { data: profile } = useQuery(getMyProfile, {
    display_name: '',
    handle: '',
    bio: '',
  } as any);

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Seed the fields once the profile lands, without clobbering edits in flight.
  useEffect(() => {
    if (loaded || !profile?.handle) return;
    setName(profile.display_name ?? '');
    setHandle(profile.handle ?? '');
    setBio(profile.bio ?? '');
    setLoaded(true);
  }, [profile, loaded]);

  const { run: save, loading, error } = useAction(updateProfile);

  const submit = async () => {
    if (!isBackendConfigured) return navigation.goBack();
    const saved = await save({
      display_name: name.trim(),
      handle: handle.trim().toLowerCase(),
      bio: bio.trim() || null,
    } as any);
    if (saved) navigation.goBack();
  };

  return (
    <ScreenBackground tone="base" glow={false}>
      <NavHeader
        variant="back"
        title="Edit profile"
        onBack={() => navigation.goBack()}
        rightActions={[
          {
            icon: <Text style={styles.save}>{loading ? '…' : 'Save'}</Text>,
            onPress: submit,
            accessibilityLabel: 'Save profile',
          },
        ]}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.avatarWrap}>
          <Avatar size="xl" initials={handle.slice(0, 2).toUpperCase()} tint="a" />
          <Text style={styles.change}>Change photo</Text>
        </Pressable>

        <TextInput label="Display name" value={name} onChangeText={setName} />
        <TextInput
          label="Handle"
          value={handle}
          onChangeText={(t) => setHandle(t.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
          autoCapitalize="none"
        />
        <TextInput
          label="Bio"
          value={bio}
          onChangeText={setBio}
          multiline
          maxChars={80}
          showCounter
          error={error ? error.message : undefined}
        />
        <Button label="Save changes" onPress={submit} loading={loading} fullWidth />
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screenGutter, gap: spacing[4], paddingBottom: spacing[8] },
  save: { fontFamily: 'Barlow-SemiBold', fontSize: 15, color: colors.semantic.awaiting },
  avatarWrap: { alignItems: 'center', gap: spacing[2], paddingVertical: spacing[3] },
  change: { fontFamily: 'Barlow-SemiBold', fontSize: 13, color: colors.text.link },
});
